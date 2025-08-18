(function() {
  'use strict';

  // State management
  const STORAGE_KEY = 'todo.pwa.tasks.v1';
  const THEME_KEY = 'todo.pwa.theme';

  /** @typedef {{id:string,title:string,completed:boolean,tags:string[],priority:'alta'|'media'|'baixa',createdAt:number,updatedAt:number}} Task */
  /** @type {Task[]} */
  let tasks = [];
  let activeFilter = 'todas'; // 'todas' | 'pendentes' | 'concluidas'
  let searchQuery = '';
  let deferredPrompt = null;

  // Elements
  const el = {
    form: document.getElementById('taskForm'),
    title: document.getElementById('taskTitle'),
    tags: document.getElementById('taskTags'),
    priority: document.getElementById('taskPriority'),
    list: document.getElementById('taskList'),
    empty: document.getElementById('emptyState'),
    search: document.getElementById('search'),
    filters: document.querySelector('.filters'),
    themeToggle: document.getElementById('themeToggle'),
    installBtn: document.getElementById('installBtn'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg'),
    toastAction: document.getElementById('toastAction'),
  };

  // Utils
  const generateId = () => (crypto && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const parseTags = (raw) => raw.split(',').map(s => s.trim()).filter(Boolean);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(tasks)) tasks = [];
    } catch (e) {
      tasks = [];
    }
  }

  function setTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0b1220');
    } else {
      root.removeAttribute('data-theme');
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#14b8a6');
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }

  // CRUD operations
  function addTask(title, tags, priority) {
    /** @type {Task} */
    const task = {
      id: generateId(),
      title: title.trim(),
      completed: false,
      tags: tags,
      priority: priority,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tasks.unshift(task);
    save();
    render();
  }

  function updateTask(id, updates) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    tasks[idx] = { ...tasks[idx], ...updates, updatedAt: Date.now() };
    save();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    save();
    render();
  }

  // Rendering
  function render() {
    const filtered = tasks.filter(task => {
      if (activeFilter === 'pendentes' && task.completed) return false;
      if (activeFilter === 'concluidas' && !task.completed) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = task.title.toLowerCase().includes(q);
        const inTags = task.tags.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inTags) return false;
      }
      return true;
    });

    el.list.innerHTML = '';
    if (filtered.length === 0) {
      el.empty.hidden = false;
      return;
    } else {
      el.empty.hidden = true;
    }

    for (const task of filtered) {
      const li = document.createElement('li');
      li.className = `task-item${task.completed ? ' completed' : ''}`;
      li.dataset.id = task.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.className = 'toggle';
      checkbox.setAttribute('aria-label', task.completed ? 'Reabrir tarefa' : 'Concluir tarefa');

      const main = document.createElement('div');
      main.className = 'task-main';

      const title = document.createElement('p');
      title.className = 'task-title';
      title.textContent = task.title;

      const meta = document.createElement('div');
      meta.className = 'task-meta';
      const pri = document.createElement('span');
      pri.className = `priority ${task.priority}`;
      pri.textContent = `Prioridade: ${task.priority}`;
      meta.appendChild(pri);
      for (const tag of task.tags) {
        const chip = document.createElement('span');
        chip.className = 'tag';
        chip.textContent = `#${tag}`;
        meta.appendChild(chip);
      }

      main.appendChild(title);
      main.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'task-actions';
      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn';
      editBtn.title = 'Editar';
      editBtn.setAttribute('aria-label', 'Editar tarefa');
      editBtn.textContent = '✏️';
      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn danger';
      delBtn.title = 'Excluir';
      delBtn.setAttribute('aria-label', 'Excluir tarefa');
      delBtn.textContent = '🗑️';
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(checkbox);
      li.appendChild(main);
      li.appendChild(actions);
      el.list.appendChild(li);
    }
  }

  // Inline edit UI
  function enterEditMode(li) {
    const id = li.dataset.id;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    li.innerHTML = '';

    const editRow = document.createElement('div');
    editRow.className = 'edit-row';

    const titleIn = document.createElement('input');
    titleIn.type = 'text';
    titleIn.value = task.title;
    titleIn.placeholder = 'Título';

    const tagsIn = document.createElement('input');
    tagsIn.type = 'text';
    tagsIn.value = task.tags.join(', ');
    tagsIn.placeholder = 'Tags (vírgulas)';

    const priIn = document.createElement('select');
    priIn.innerHTML = '<option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>';
    priIn.value = task.priority;

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary';
    saveBtn.textContent = 'Salvar';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn ghost';
    cancelBtn.textContent = 'Cancelar';

    editRow.appendChild(titleIn);
    editRow.appendChild(tagsIn);
    editRow.appendChild(priIn);
    editRow.appendChild(saveBtn);
    editRow.appendChild(cancelBtn);

    li.appendChild(editRow);

    saveBtn.addEventListener('click', () => {
      const newTitle = titleIn.value.trim();
      if (!newTitle) return;
      const newTags = parseTags(tagsIn.value || '');
      const newPri = priIn.value;
      updateTask(id, { title: newTitle, tags: newTags, priority: newPri });
    });

    cancelBtn.addEventListener('click', () => render());
  }

  // Event listeners
  function bindEvents() {
    el.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = el.title.value.trim();
      if (!title) {
        el.title.focus();
        return;
      }
      const tags = parseTags(el.tags.value || '');
      const priority = el.priority.value;
      addTask(title, tags, priority);
      el.form.reset();
      el.title.focus();
    });

    el.filters.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      activeFilter = btn.dataset.filter;
      for (const elb of el.filters.querySelectorAll('button[data-filter]')) {
        elb.classList.toggle('active', elb === btn);
        elb.setAttribute('aria-selected', String(elb === btn));
      }
      render();
    });

    el.search.addEventListener('input', () => {
      searchQuery = el.search.value.trim();
      render();
    });

    el.list.addEventListener('change', (e) => {
      if (e.target.matches('input.toggle')) {
        const li = e.target.closest('li');
        const id = li.dataset.id;
        updateTask(id, { completed: e.target.checked });
      }
    });

    el.list.addEventListener('click', (e) => {
      const li = e.target.closest('li.task-item');
      if (!li) return;
      if (e.target.matches('.icon-btn.danger')) {
        const id = li.dataset.id;
        deleteTask(id);
        return;
      }
      if (e.target.matches('.icon-btn')) {
        enterEditMode(li);
      }
    });

    el.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });

    // Install PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      el.installBtn.hidden = false;
    });
    el.installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      el.installBtn.hidden = true;
    });

    // Toast action (reload)
    el.toastAction.addEventListener('click', () => window.location.reload());
  }

  // Service worker registration + update UX
  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      function promptToRefresh() {
        showToast('Atualização disponível', 'Atualizar');
        el.toastAction.onclick = () => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          } else {
            window.location.reload();
          }
        };
      }

      if (registration.waiting) {
        promptToRefresh();
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            promptToRefresh();
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New SW has taken control
        window.location.reload();
      });
    } catch (err) {
      // noop
    }
  }

  function showToast(message, actionLabel) {
    el.toastMsg.textContent = message;
    el.toastAction.textContent = actionLabel || 'OK';
    el.toast.hidden = false;
  }

  // Init
  initTheme();
  load();
  bindEvents();
  render();
  registerServiceWorker();
})();

