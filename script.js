document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTask');
    const taskList = document.getElementById('taskList');
    const themeToggle = document.getElementById('themeToggle');
    const taskModal = document.getElementById('taskModal');
    const searchInput = document.querySelector('.search-bar input');
    const filterButtons = document.querySelectorAll('.filter-group button');
    const sortSelect = document.querySelector('.sort-group select');

    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentSort = 'date';
    let currentTheme = localStorage.getItem('theme') || 'light';

    // Initialize
    initTheme();
    initSortable();
    renderTasks();

    // Theme Toggle
    themeToggle.addEventListener('change', () => {
        document.body.setAttribute('data-theme', 
            document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
        );
        localStorage.setItem('theme', document.body.getAttribute('data-theme'));
    });

    // Initialize Theme
    function initTheme() {
        document.body.setAttribute('data-theme', currentTheme);
        themeToggle.checked = currentTheme === 'dark';
    }

    // Initialize Sortable
    function initSortable() {
        new Sortable(taskList, {
            animation: 150,
            ghostClass: 'task-ghost',
            onEnd: function(evt) {
                const itemEl = evt.item;
                const newIndex = evt.newIndex;
                const oldIndex = evt.oldIndex;
                
                // Update tasks array
                const task = tasks.splice(oldIndex, 1)[0];
                tasks.splice(newIndex, 0, task);
                
                saveTasks();
            }
        });
    }

    // Render Tasks
    function renderTasks() {
        taskList.innerHTML = '';
        
        let filteredTasks = filterTasks(tasks);
        filteredTasks = sortTasks(filteredTasks);
        
        filteredTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`;
            li.innerHTML = `
                <div class="task-content">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleComplete(${index})"></div>
                    <div class="task-info">
                        <div class="task-title">${task.text}</div>
                        <div class="task-meta">
                            <span><i class="fas fa-tag"></i> ${task.category}</span>
                            <span><i class="fas fa-calendar"></i> ${formatDate(task.date)}</span>
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button onclick="editTask(${index})" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTask(${index})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            taskList.appendChild(li);
        });
    }

    // Filter Tasks
    function filterTasks(tasks) {
        switch(currentFilter) {
            case 'active':
                return tasks.filter(task => !task.completed);
            case 'completed':
                return tasks.filter(task => task.completed);
            default:
                return tasks;
        }
    }

    // Sort Tasks
    function sortTasks(tasks) {
        switch(currentSort) {
            case 'priority':
                return tasks.sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));
            case 'alphabetical':
                return tasks.sort((a, b) => a.text.localeCompare(b.text));
            default:
                return tasks.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    }

    // Get Priority Value
    function getPriorityValue(priority) {
        switch(priority) {
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
        }
    }

    // Format Date
    function formatDate(dateString) {
        if (!dateString) return 'Tarih yok';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Add Task
    function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            const task = {
                text,
                completed: false,
                priority: 'medium',
                category: 'İş',
                date: new Date().toISOString(),
                description: ''
            };
            tasks.push(task);
            taskInput.value = '';
            renderTasks();
            saveTasks();
        }
    }

    // Edit Task
    window.editTask = (index) => {
        const task = tasks[index];
        document.getElementById('taskTitle').value = task.text;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskDate').value = task.date ? task.date.slice(0, 16) : '';
        
        taskModal.classList.add('active');
        
        // Save button handler
        const saveBtn = document.querySelector('.btn-save');
        const oldClickHandler = saveBtn.onclick;
        saveBtn.onclick = () => {
            task.text = document.getElementById('taskTitle').value;
            task.description = document.getElementById('taskDescription').value;
            task.priority = document.getElementById('taskPriority').value;
            task.category = document.getElementById('taskCategory').value;
            task.date = document.getElementById('taskDate').value;
            
            renderTasks();
            saveTasks();
            taskModal.classList.remove('active');
            saveBtn.onclick = oldClickHandler;
        };
    };

    // Toggle Complete
    window.toggleComplete = (index) => {
        tasks[index].completed = !tasks[index].completed;
        renderTasks();
        saveTasks();
    };

    // Delete Task
    window.deleteTask = (index) => {
        const taskElement = taskList.children[index];
        taskElement.classList.add('deleting');
        
        setTimeout(() => {
            tasks.splice(index, 1);
            renderTasks();
            saveTasks();
        }, 300);
    };

    // Save Tasks
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        tasks = tasks.map(task => ({
            ...task,
            visible: task.text.toLowerCase().includes(searchTerm)
        }));
        renderTasks();
    });

    // Filters
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.textContent.toLowerCase();
            renderTasks();
        });
    });

    // Sort
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value.toLowerCase();
        renderTasks();
    });

    // Modal Close
    document.querySelector('.close-modal').addEventListener('click', () => {
        taskModal.classList.remove('active');
    });

    document.querySelector('.btn-cancel').addEventListener('click', () => {
        taskModal.classList.remove('active');
    });

    // Share Feature
    document.querySelector('.btn-share').addEventListener('click', () => {
        const shareData = {
            title: 'ProTodo Listesi',
            text: 'Görevlerim: ' + tasks.map(t => t.text).join(', '),
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData)
                .catch(error => console.log('Paylaşım hatası:', error));
        } else {
            // Fallback for browsers that don't support Web Share API
            const textArea = document.createElement('textarea');
            textArea.value = shareData.text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Görev listesi panoya kopyalandı!');
        }
    });
}); 