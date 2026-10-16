const STORAGE_KEY = 'tarefas-projeto-itens-v2';
const INITIALIZED_KEY = `${STORAGE_KEY}-initialized`;
const statusLabels = {
  todo: 'A fazer',
  progress: 'Em andamento',
  done: 'Concluída',
  late: 'Atrasada'
};
const priorityLabels = { high: 'Alta', medium: 'Média', low: 'Baixa' };
const priorityClasses = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
const statusClasses = { todo: 'status-todo', progress: 'status-progress', done: 'status-done', late: 'status-late' };
const categoryClasses = ['tag-red', 'tag-yellow', 'tag-orange', 'tag-green'];
const assigneeInitials = {
  'Matheus Martins': 'MM',
  'Luanna dos Anjos': 'LA',
  'Jessica Scarlette': 'JS',
  'Marcos Fernandes': 'MF',
  'Murilo Azedo': 'MA'
};
const assigneeClasses = {
  'Matheus Martins': 'avatar-coral',
  'Luanna dos Anjos': 'avatar-blue',
  'Jessica Scarlette': 'avatar-green',
  'Marcos Fernandes': 'avatar-extra',
  'Murilo Azedo': 'avatar-yellow'
};
const oldAssigneeNames = {
  'Mariana Costa': 'Matheus Martins',
  'Lucas Costa': 'Luanna dos Anjos',
  'Rafa Alves': 'Jessica Scarlette',
  'João Prado': 'Marcos Fernandes'
};
const initialTasks = [
  { id: '5bc1fb8a-c715-4139-8b08-1e1ed12f7f25', title: 'Atividade aprendizado de maquina', description: '', assignee: 'Matheus Martins', category: 'Desenvolvimento', status: 'todo', dueDate: '2026-10-06', priority: 'high' },
  { id: '125014e4-ba37-4395-a134-d7ee556e7b10', title: 'atividade banco de dados', description: '', assignee: 'Luanna dos Anjos', category: 'Desenvolvimento', status: 'todo', dueDate: '2006-10-07', priority: 'medium' },
  { id: '913c1874-11b3-44f3-8331-2d92f251f458', title: 'front end', description: '', assignee: 'Jessica Scarlette', category: 'Design', status: 'todo', dueDate: '2006-10-10', priority: 'low' },
  { id: '4c010b4c-f0af-4234-ba53-7967bb4c042b', title: 'trabalho de TI', description: '', assignee: 'Marcos Fernandes', category: 'Documentação', status: 'progress', dueDate: '2026-10-01', priority: 'high' },
  { id: '73b2cb06-4965-429c-a867-9c8f66d99d9b', title: 'Pesquisa das maquinas', description: '', assignee: 'Luanna dos Anjos', category: 'Pesquisa', status: 'progress', dueDate: '2006-10-04', priority: 'medium' },
  { id: 'fdadc015-3810-49f0-a22f-6936e750e969', title: 'pesquisa das fontes', description: '', assignee: 'Matheus Martins', category: 'Pesquisa', status: 'done', dueDate: '2026-09-30', priority: 'low' },
  { id: 'cfb35815-ff32-4421-bd18-991d4b7ff9cd', title: 'atividade design', description: '', assignee: 'Jessica Scarlette', category: 'Design', status: 'late', dueDate: '2026-09-28', priority: 'high' },
  { id: '2daa3717-2f02-45e1-977d-a74c1da6b4b7', title: 'desenvolver tela principal', description: '', assignee: 'Marcos Fernandes', category: 'Desenvolvimento', status: 'late', dueDate: '2026-09-29', priority: 'medium' }
];

const dialog = document.querySelector('#task-dialog');
const form = document.querySelector('#task-form');
const boardColumns = [...document.querySelectorAll('.task-column')];
const boardView = document.querySelector('.board-view');
const tableBody = document.querySelector('.list-view tbody');
const tableFooter = document.querySelector('.table-footer');
const workspace = document.querySelector('.workspace');
const taskStatuses = ['todo', 'progress', 'done', 'late'];
const filterButton = document.querySelector('.filter-button');
const filterPanel = document.querySelector('#filter-panel');
const filterCount = document.querySelector('.filter-count');
const filterFields = [...document.querySelectorAll('[data-task-filter]')];

function populateFilterOptions(filterName, sourceSelect) {
  const filterSelect = document.querySelector(`[data-task-filter="${filterName}"]`);
  [...sourceSelect.options].filter(option => option.value).forEach(option => {
    filterSelect.add(new Option(option.textContent, option.value));
  });
}

populateFilterOptions('assignee', form.elements.assignee);
populateFilterOptions('category', form.elements.category);

function readSavedTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

let tasks = readSavedTasks();
if (localStorage.getItem(INITIALIZED_KEY) !== 'true') {
  if (tasks.length === 0) tasks = initialTasks.map(task => ({ ...task }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  localStorage.setItem(INITIALIZED_KEY, 'true');
}
let editingTaskId = null;
let migratedAssignees = false;
tasks = tasks.map(task => {
  const newAssignee = oldAssigneeNames[task.assignee];
  if (!newAssignee) return task;
  migratedAssignees = true;
  return { ...task, assignee: newAssignee };
});
if (migratedAssignees) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function formatDate(value) {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${value}T12:00:00`))
    .replace('.', '');
}

function taskCard(task) {
  const categoryIndex = Math.max(0, [...document.querySelectorAll('select[name="category"] option')]
    .findIndex(option => option.value === task.category));
  const tagClass = categoryClasses[(categoryIndex - 1 + categoryClasses.length) % categoryClasses.length];
  const assigneeClass = assigneeClasses[task.assignee] || 'avatar-extra';
  return `<article class="task-card" tabindex="0" data-task-id="${escapeHtml(task.id)}">
    <div class="task-card-top"><span class="tag ${tagClass}">${escapeHtml(task.category)}</span><button class="more-button" type="button" aria-label="Opções da tarefa">···</button></div>
    <div class="task-actions-menu" role="menu" hidden><button type="button" role="menuitem" data-edit-task>Editar tarefa</button></div>
    <h3>${escapeHtml(task.title)}</h3>
    <div class="task-meta"><span>▧ &nbsp;${escapeHtml(formatDate(task.dueDate))}</span><span>☑ &nbsp;0/0</span></div>
    <div class="task-card-bottom"><span class="priority ${priorityClasses[task.priority]}"><i></i>${priorityLabels[task.priority]}</span><span class="avatar ${assigneeClass}" aria-label="Responsável: ${escapeHtml(task.assignee)}">${assigneeInitials[task.assignee] || '??'}</span></div>
  </article>`;
}

function tableRow(task) {
  const assigneeClass = assigneeClasses[task.assignee] || 'avatar-extra';
  return `<tr data-task-id="${escapeHtml(task.id)}">
    <td><label class="task-name"><input type="checkbox" ${task.status === 'done' ? 'checked' : ''}><span>${escapeHtml(task.title)}</span></label></td>
    <td><span class="avatar ${assigneeClass}">${assigneeInitials[task.assignee] || '??'}</span> ${escapeHtml(task.assignee)}</td>
    <td><span class="priority ${priorityClasses[task.priority]}"><i></i>${priorityLabels[task.priority]}</span></td>
    <td>${escapeHtml(formatDate(task.dueDate))}</td>
    <td><span class="status ${statusClasses[task.status]}">${statusLabels[task.status]}</span></td>
  </tr>`;
}

function getFilteredTasks() {
  const activeFilters = Object.fromEntries(filterFields.map(field => [field.dataset.taskFilter, field.value]));
  return tasks.filter(task => Object.entries(activeFilters)
    .every(([key, value]) => !value || task[key] === value));
}

function updateFilterCount() {
  const activeCount = filterFields.filter(field => field.value).length;
  filterCount.textContent = String(activeCount);
  filterCount.hidden = activeCount === 0;
  filterButton.classList.toggle('has-filters', activeCount > 0);
}

function renderTasks() {
  const visibleTasks = getFilteredTasks();
  boardColumns.forEach((column, index) => {
    const status = taskStatuses[index];
    const taskList = column.querySelector('.task-list');
    const matchingTasks = visibleTasks.filter(task => task.status === status);
    taskList.innerHTML = matchingTasks.length
      ? matchingTasks.map(taskCard).join('')
      : `<p class="empty-column">${tasks.length && filterFields.some(field => field.value) ? 'Nenhuma tarefa corresponde aos filtros' : 'Nenhuma tarefa'}</p>`;
    column.querySelector('.task-count').textContent = String(matchingTasks.length);
  });

  tableBody.innerHTML = visibleTasks.map(tableRow).join('');
  const totalRows = tableBody.querySelectorAll('tr').length;
  tableFooter.textContent = filterFields.some(field => field.value)
    ? `Mostrando ${totalRows} de ${tasks.length} tarefas`
    : `Mostrando ${totalRows} tarefas`;
}

function updateView() {
  workspace.classList.toggle('is-list-view', document.querySelector('#view-list').checked);
}

document.querySelectorAll('.view-input').forEach(input => input.addEventListener('change', updateView));

filterButton.addEventListener('click', () => {
  const shouldOpen = filterPanel.hidden;
  filterPanel.hidden = !shouldOpen;
  filterButton.setAttribute('aria-expanded', String(shouldOpen));
  if (shouldOpen) filterFields[0].focus();
});

filterFields.forEach(field => field.addEventListener('change', () => {
  updateFilterCount();
  renderTasks();
}));

document.querySelector('[data-clear-filters]').addEventListener('click', () => {
  filterFields.forEach(field => { field.value = ''; });
  updateFilterCount();
  renderTasks();
  filterFields[0].focus();
});

document.addEventListener('click', event => {
  if (filterPanel.hidden || filterPanel.contains(event.target) || filterButton.contains(event.target)) return;
  filterPanel.hidden = true;
  filterButton.setAttribute('aria-expanded', 'false');
});

tableBody.addEventListener('change', event => {
  if (!event.target.matches('input[type="checkbox"]')) return;
  const taskId = event.target.closest('tr').dataset.taskId;
  const task = tasks.find(item => item.id === taskId);
  if (!task) return;

  task.status = event.target.checked ? 'done' : 'todo';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  renderTasks();
});

function openDialog(task = null) {
  editingTaskId = task?.id || null;
  form.reset();
  document.querySelector('[data-dialog-title]').textContent = task ? 'Editar tarefa' : 'Nova tarefa';
  document.querySelector('[data-dialog-icon]').textContent = task ? '✎' : '＋';
  form.querySelector('[type="submit"]').textContent = task ? 'Salvar alterações' : 'Criar tarefa';
  if (task) {
    Object.entries(task).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value;
    });
  }
  dialog.showModal();
  form.elements.title.focus();
}

function closeDialog() {
  dialog.close();
}

document.querySelectorAll('[data-open-task-form]').forEach(button => {
  button.addEventListener('click', () => openDialog());
});

boardView.addEventListener('click', event => {
  const editButton = event.target.closest('[data-edit-task]');
  if (editButton) {
    const taskId = editButton.closest('[data-task-id]').dataset.taskId;
    const task = tasks.find(item => item.id === taskId);
    editButton.closest('.task-actions-menu').hidden = true;
    if (task) openDialog(task);
    return;
  }

  const moreButton = event.target.closest('.task-card .more-button');
  if (moreButton) {
    const menu = moreButton.closest('.task-card').querySelector('.task-actions-menu');
    boardView.querySelectorAll('.task-actions-menu').forEach(openMenu => {
      if (openMenu !== menu) openMenu.hidden = true;
    });
    menu.hidden = !menu.hidden;
    return;
  }

  if (!event.target.closest('.task-actions-menu')) {
    boardView.querySelectorAll('.task-actions-menu').forEach(menu => { menu.hidden = true; });
  }
});

document.querySelectorAll('[data-close-task-form]').forEach(button => {
  button.addEventListener('click', closeDialog);
});

dialog.addEventListener('click', event => {
  if (event.target === dialog) closeDialog();
});

dialog.addEventListener('close', () => {
  form.reset();
  editingTaskId = null;
  document.querySelector('[data-dialog-title]').textContent = 'Nova tarefa';
  document.querySelector('[data-dialog-icon]').textContent = '＋';
  form.querySelector('[type="submit"]').textContent = 'Criar tarefa';
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const taskData = {
    title: data.get('title').trim(),
    description: data.get('description').trim(),
    assignee: data.get('assignee'),
    category: data.get('category'),
    status: data.get('status'),
    dueDate: data.get('dueDate'),
    priority: data.get('priority')
  };

  if (!taskData.title) return;
  if (editingTaskId) {
    const task = tasks.find(item => item.id === editingTaskId);
    if (!task) return;
    Object.assign(task, taskData);
  } else {
    tasks.push({ id: crypto.randomUUID(), ...taskData });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  renderTasks();
  closeDialog();
});

renderTasks();
updateFilterCount();
updateView();