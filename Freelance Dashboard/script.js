// Utility selectors
const qs = (s) => document.querySelector(s);
const qsa = (s) => document.querySelectorAll(s);

// === THEME TOGGLE ===
const themeToggleBtn = qs('#themeToggle');
themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  if (document.body.classList.contains('dark')) {
    themeToggleBtn.textContent = '☀️ Light Mode';
  } else {
    themeToggleBtn.textContent = '🌙 Dark Mode';
  }
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
});
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  themeToggleBtn.textContent = '☀️ Light Mode';
}

// === TAB SWITCHING ===
const tabButtons = qsa('.tab-btn');
const tabContents = qsa('.tab-content');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const target = btn.dataset.tab;
    tabContents.forEach(tc => {
      tc.classList.toggle('active', tc.id === target);
    });
  });
});

// ===================
// PROJECT TIMELINE
// ===================
const taskForm = qs('#taskForm');
const taskNameInput = qs('#taskName');
const taskDurationInput = qs('#taskDuration');
const timelineContainer = qs('#timelineContainer');

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  timelineContainer.innerHTML = '';
  tasks.forEach((task, i) => {
    const div = document.createElement('div');
    div.className = 'timeline-task';
    div.draggable = true;
    div.dataset.index = i;

    div.innerHTML = `
      <strong>${task.name}</strong>
      <span class="duration">${task.duration} day(s)</span>
      <button class="delete-btn" title="Delete Task" style="margin-top:5px; background:#dc3545; border:none; color:white; border-radius:4px; cursor:pointer;">Delete</button>
    `;

    // Drag and Drop Handlers
    div.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', i);
      div.classList.add('dragging');
    });
    div.addEventListener('dragend', () => {
      div.classList.remove('dragging');
    });

    div.querySelector('.delete-btn').addEventListener('click', () => {
      tasks.splice(i, 1);
      saveTasks();
      renderTasks();
    });

    timelineContainer.appendChild(div);
  });
}

// Allow dropping and reordering tasks
timelineContainer.addEventListener('dragover', (e) => {
  e.preventDefault();
  const draggingEl = timelineContainer.querySelector('.dragging');
  const afterElement = getDragAfterElement(timelineContainer, e.clientX);
  if (afterElement == null) {
    timelineContainer.appendChild(draggingEl);
  } else {
    timelineContainer.insertBefore(draggingEl, afterElement);
  }
});

timelineContainer.addEventListener('drop', (e) => {
  e.preventDefault();
  const draggingIndex = Number(e.dataTransfer.getData('text/plain'));
  const draggingEl = timelineContainer.querySelector('.dragging');
  draggingEl.classList.remove('dragging');

  // Update tasks array order based on new DOM order
  const newTasks = [];
  timelineContainer.querySelectorAll('.timeline-task').forEach(taskDiv => {
    const idx = Number(taskDiv.dataset.index);
    newTasks.push(tasks[idx]);
  });
  tasks = newTasks;
  saveTasks();
  renderTasks();
});

function getDragAfterElement(container, x) {
  const draggableElements = [...container.querySelectorAll('.timeline-task:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = taskNameInput.value.trim();
  const duration = Number(taskDurationInput.value);
  if (!name || duration <= 0) return;

  tasks.push({ name, duration });
  saveTasks();
  renderTasks();

  taskForm.reset();
});

// Initial render
renderTasks();

// ===================
// CLIENT MANAGEMENT
// ===================
const clientForm = qs('#clientForm');
const clientNameInput = qs('#clientName');
const clientEmailInput = qs('#clientEmail');
const clientList = qs('#clientList');

let clients = JSON.parse(localStorage.getItem('clients') || '[]');

function saveClients() {
  localStorage.setItem('clients', JSON.stringify(clients));
}

function renderClients() {
  clientList.innerHTML = '';
  clients.forEach((client, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="client-info"><strong>${client.name}</strong> (${client.email})</div>
      <button title="Delete Client">Delete</button>
    `;
    li.querySelector('button').addEventListener('click', () => {
      clients.splice(i, 1);
      saveClients();
      renderClients();
    });
    clientList.appendChild(li);
  });
}

clientForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = clientNameInput.value.trim();
  const email = clientEmailInput.value.trim();
  if (!name || !email) return;

  clients.push({ name, email });
  saveClients();
  renderClients();
  clientForm.reset();
});
renderClients();

// ===================
// INVOICE GENERATOR
// ===================
const invoiceForm = qs('#invoiceForm');
const invoiceClientInput = qs('#invoiceClient');
const invoiceDescInput = qs('#invoiceDesc');
const invoiceQtyInput = qs('#invoiceQty');
const invoiceRateInput = qs('#invoiceRate');
const invoiceTableBody = qs('#invoiceTable tbody');
const invoiceTotalDiv = qs('#invoiceTotal');
const saveInvoiceBtn = qs('#saveInvoiceBtn');
const savedInvoicesDiv = qs('#savedInvoices');

let invoiceItems = [];
let savedInvoices = JSON.parse(localStorage.getItem('savedInvoices') || '[]');

function saveInvoiceItems() {
  localStorage.setItem('invoiceItems', JSON.stringify(invoiceItems));
}

function renderInvoiceItems() {
  invoiceTableBody.innerHTML = '';
  let total = 0;
  invoiceItems.forEach((item, i) => {
    const itemTotal = item.qty * item.rate;
    total += itemTotal;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.desc}</td>
      <td>${item.qty}</td>
      <td>$${item.rate.toFixed(2)}</td>
      <td>$${itemTotal.toFixed(2)}</td>
      <td><button data-index="${i}">Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => {
      invoiceItems.splice(i, 1);
      saveInvoiceItems();
      renderInvoiceItems();
    });
    invoiceTableBody.appendChild(tr);
  });
  invoiceTotalDiv.textContent = `Total: $${total.toFixed(2)}`;
}

invoiceForm.addEventListener('submit', e => {
  e.preventDefault();
  const client = invoiceClientInput.value.trim();
  const desc = invoiceDescInput.value.trim();
  const qty = Number(invoiceQtyInput.value);
  const rate = Number(invoiceRateInput.value);
  if (!client || !desc || qty <= 0 || rate < 0) return;

  invoiceItems.push({ client, desc, qty, rate });
  saveInvoiceItems();
  renderInvoiceItems();
  invoiceForm.reset();
});

// Save invoice permanently
saveInvoiceBtn.addEventListener('click', () => {
  if (invoiceItems.length === 0) {
    alert('Add at least one line item before saving invoice.');
    return;
  }
  const client = invoiceItems[0].client; // take client from first item
  const total = invoiceItems.reduce((acc, cur) => acc + cur.qty * cur.rate, 0);

  savedInvoices.push({ client, items: [...invoiceItems], total, date: new Date().toLocaleString() });
  localStorage.setItem('savedInvoices', JSON.stringify(savedInvoices));
  invoiceItems = [];
  saveInvoiceItems();
  renderInvoiceItems();
  renderSavedInvoices();
  alert('Invoice saved successfully!');
});

function renderSavedInvoices() {
  savedInvoicesDiv.innerHTML = '<h3>Saved Invoices</h3>';
  if (savedInvoices.length === 0) {
    savedInvoicesDiv.innerHTML += '<p>No saved invoices.</p>';
    return;
  }
  savedInvoices.forEach((inv, i) => {
    const div = document.createElement('div');
    div.style = 'border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:5px;';
    div.innerHTML = `
      <strong>Client:</strong> ${inv.client} <br />
      <strong>Date:</strong> ${inv.date} <br />
      <strong>Total:</strong> $${inv.total.toFixed(2)} <br />
      <details>
        <summary>Items</summary>
        <ul>
          ${inv.items.map(it => `<li>${it.desc} - Qty: ${it.qty}, Rate: $${it.rate.toFixed(2)}</li>`).join('')}
        </ul>
      </details>
      <button data-index="${i}" style="margin-top:5px; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer;">Delete Invoice</button>
    `;
    div.querySelector('button').addEventListener('click', () => {
      savedInvoices.splice(i, 1);
      localStorage.setItem('savedInvoices', JSON.stringify(savedInvoices));
      renderSavedInvoices();
    });
    savedInvoicesDiv.appendChild(div);
  });
}
renderInvoiceItems();
renderSavedInvoices();

// ===================
// POMODORO TIMER + NOTES
// ===================
const timerDisplay = qs('#timerDisplay');
const startPauseBtn = qs('#startPauseBtn');
const resetBtn = qs('#resetBtn');
const projectNotes = qs('#projectNotes');

let pomodoroDuration = 25 * 60; // 25 minutes in seconds
let timer = pomodoroDuration;
let timerInterval = null;
let isRunning = false;

// Load saved notes
projectNotes.value = localStorage.getItem('projectNotes') || '';

function updateTimerDisplay() {
  let minutes = Math.floor(timer / 60);
  let seconds = timer % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startPauseBtn.textContent = 'Pause';
  timerInterval = setInterval(() => {
    if (timer <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      alert('Pomodoro session complete! Take a break.');
      timer = pomodoroDuration;
      updateTimerDisplay();
      startPauseBtn.textContent = 'Start';
      return;
    }
    timer--;
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  startPauseBtn.textContent = 'Start';
}

startPauseBtn.addEventListener('click', () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

resetBtn.addEventListener('click', () => {
  pauseTimer();
  timer = pomodoroDuration;
  updateTimerDisplay();
});

// Save notes on input
project
