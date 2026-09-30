const defaultProjects = [
    {
        id: "personal",
        name: "Personal",
        color: "#6366f1"
    },
    {
        id: "work",
        name: "Work",
        color: "#06b6d4"
    }
];

const defaultTasks = [
    {
        id: "task-1",
        title: "Design landing page",
        description: "Create the first version of the landing page UI.",
        projectId: "work",
        priority: "high",
        status: "progress",
        dueDate: getFutureDate(2),
        createdAt: Date.now() - 500000
    },
    {
        id: "task-2",
        title: "Setup project structure",
        description: "Create the HTML, CSS and JavaScript structure.",
        projectId: "work",
        priority: "medium",
        status: "done",
        dueDate: getFutureDate(-1),
        createdAt: Date.now() - 800000
    },
    {
        id: "task-3",
        title: "Buy groceries",
        description: "Milk, bread, eggs and some fruits.",
        projectId: "personal",
        priority: "low",
        status: "todo",
        dueDate: getFutureDate(3),
        createdAt: Date.now() - 200000
    },
    {
        id: "task-4",
        title: "Study JavaScript",
        description: "Review DOM manipulation and event listeners.",
        projectId: "personal",
        priority: "high",
        status: "todo",
        dueDate: getFutureDate(5),
        createdAt: Date.now() - 100000
    }
];

let projects = JSON.parse(localStorage.getItem("khallasna_projects")) || defaultProjects;
let tasks = JSON.parse(localStorage.getItem("khallasna_tasks")) || defaultTasks;

let currentProject = "all";
let currentView = "dashboard";
let currentFilter = "all";
let currentSearch = "";
let draggedTaskId = null;

const projectList = document.getElementById("projectList");
const dashboardView = document.getElementById("dashboardView");
const boardView = document.getElementById("boardView");
const boardTitle = document.getElementById("boardTitle");
const boardSubtitle = document.getElementById("boardSubtitle");

const taskModal = document.getElementById("taskModal");
const projectModal = document.getElementById("projectModal");

const taskForm = document.getElementById("taskForm");
const projectForm = document.getElementById("projectForm");

const taskId = document.getElementById("taskId");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskProject = document.getElementById("taskProject");
const taskPriority = document.getElementById("taskPriority");
const taskStatus = document.getElementById("taskStatus");
const taskDueDate = document.getElementById("taskDueDate");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

function getFutureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
}

function saveData() {
    localStorage.setItem("khallasna_projects", JSON.stringify(projects));
    localStorage.setItem("khallasna_tasks", JSON.stringify(tasks));
}

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function getProject(projectId) {
    return projects.find(project => project.id === projectId);
}

function getFilteredTasks() {
    let result = [...tasks];

    if (currentProject !== "all") {
        result = result.filter(task => task.projectId === currentProject);
    }

    if (currentSearch.trim()) {
        const search = currentSearch.toLowerCase();

        result = result.filter(task =>
            task.title.toLowerCase().includes(search) ||
            task.description.toLowerCase().includes(search)
        );
    }

    if (currentFilter !== "all") {
        result = result.filter(task => task.priority === currentFilter);
    }

    return result;
}

function sortTasks(list) {
    const sorted = [...list];

    if (sortSelect.value === "newest") {
        sorted.sort((a, b) => b.createdAt - a.createdAt);
    }

    if (sortSelect.value === "oldest") {
        sorted.sort((a, b) => a.createdAt - b.createdAt);
    }

    if (sortSelect.value === "priority") {
        const priorityOrder = {
            high: 1,
            medium: 2,
            low: 3
        };

        sorted.sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );
    }

    if (sortSelect.value === "dueDate") {
        sorted.sort((a, b) =>
            (a.dueDate || "9999") .localeCompare(b.dueDate || "9999")
        );
    }

    return sorted;
}

function renderProjects() {
    projectList.innerHTML = "";

    const allItem = document.createElement("div");

    allItem.className = `project-item ${currentProject === "all" ? "active" : ""}`;

    allItem.innerHTML = `
        <div class="project-name">
            <span class="project-color" style="background:#ffffff"></span>
            <span>All Tasks</span>
        </div>
        <span class="project-count">${tasks.length}</span>
    `;

    allItem.addEventListener("click", () => {
        currentProject = "all";
        currentView = "board";
        updateView();
        renderProjects();
        renderBoard();
    });

    projectList.appendChild(allItem);

    projects.forEach(project => {
        const item = document.createElement("div");

        const count = tasks.filter(
            task => task.projectId === project.id
        ).length;

        item.className = `project-item ${
            currentProject === project.id ? "active" : ""
        }`;

        item.innerHTML = `
            <div class="project-name">
                <span class="project-color" style="background:${project.color}"></span>
                <span>${escapeHTML(project.name)}</span>
            </div>
            <span class="project-count">${count}</span>
        `;

        item.addEventListener("click", () => {
            currentProject = project.id;
            currentView = "board";

            updateView();
            renderProjects();
            renderBoard();
        });

        projectList.appendChild(item);
    });
}

function renderProjectOptions() {
    taskProject.innerHTML = "";

    projects.forEach(project => {
        const option = document.createElement("option");

        option.value = project.id;
        option.textContent = project.name;

        taskProject.appendChild(option);
    });
}

function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === "done").length;
    const progress = tasks.filter(task => task.status === "progress").length;

    const today = new Date().toISOString().split("T")[0];

    const overdue = tasks.filter(task =>
        task.status !== "done" &&
        task.dueDate &&
        task.dueDate < today
    ).length;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("progressTasks").textContent = progress;
    document.getElementById("overdueTasks").textContent = overdue;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("progressPercent").textContent =
        `${percentage}%`;

    document.getElementById("completedProgress").textContent = completed;
    document.getElementById("remainingProgress").textContent =
        total - completed;

    const circle = document.querySelector(".progress-circle");

    circle.style.background =
        `conic-gradient(var(--primary) ${percentage * 3.6}deg, #232631 0deg)`;
}

function renderRecentTasks() {
    const container = document.getElementById("recentTasks");

    const recent = [...tasks]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

    if (!recent.length) {
        container.innerHTML = `
            <div class="empty-state">
                No tasks yet.
            </div>
        `;
        return;
    }

    container.innerHTML = recent.map(task => `
        <div class="recent-task">
            <div class="task-check ${task.status === "done" ? "done" : ""}"></div>

            <div class="recent-task-info">
                <strong>${escapeHTML(task.title)}</strong>
                <span>${escapeHTML(getProject(task.projectId)?.name || "Unknown project")}</span>
            </div>

            <span class="task-priority priority-${task.priority}">
                ${task.priority}
            </span>
        </div>
    `).join("");
}

function renderBoard() {
    let visibleTasks = sortTasks(getFilteredTasks());

    const currentProjectData = getProject(currentProject);

    if (currentProject === "all") {
        boardTitle.textContent = "All Tasks";
        boardSubtitle.textContent = "Manage everything from one place.";
    } else {
        boardTitle.textContent = currentProjectData
            ? currentProjectData.name
            : "Project";

        boardSubtitle.textContent =
            `${visibleTasks.length} task${visibleTasks.length !== 1 ? "s" : ""} in this project.`;
    }

    const columns = {
        todo: document.getElementById("todoTasks"),
        progress: document.getElementById("progressTasksBoard"),
        done: document.getElementById("doneTasks")
    };

    Object.values(columns).forEach(column => {
        column.innerHTML = "";
    });

    const grouped = {
        todo: [],
        progress: [],
        done: []
    };

    visibleTasks.forEach(task => {
        grouped[task.status].push(task);
    });

    Object.keys(grouped).forEach(status => {
        const container = columns[status];

        if (!grouped[status].length) {
            container.innerHTML = `
                <div class="empty-state">
                    No tasks here
                </div>
            `;
            return;
        }

        grouped[status].forEach(task => {
            container.appendChild(createTaskCard(task));
        });
    });

    document.getElementById("todoCount").textContent =
        grouped.todo.length;

    document.getElementById("progressCount").textContent =
        grouped.progress.length;

    document.getElementById("doneCount").textContent =
        grouped.done.length;
}

function createTaskCard(task) {
    const card = document.createElement("div");

    card.className = "task-card";
    card.draggable = true;
    card.dataset.id = task.id;

    const overdue = isOverdue(task);

    card.innerHTML = `
        <div class="task-card-top">
            <h4>${escapeHTML(task.title)}</h4>

            <button class="more-btn" data-edit="${task.id}">
                ⋮
            </button>
        </div>

        ${
            task.description
                ? `<p class="task-description">${escapeHTML(task.description)}</p>`
                : ""
        }

        <div class="task-meta">
            <span class="task-priority priority-${task.priority}">
                ${task.priority}
            </span>

            ${
                task.dueDate
                    ? `<span class="task-date ${overdue ? "overdue" : ""}">
                        ${formatDate(task.dueDate)}
                    </span>`
                    : ""
            }
        </div>
    `;

    card.addEventListener("dragstart", () => {
        draggedTaskId = task.id;
        card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
        draggedTaskId = null;
        card.classList.remove("dragging");
    });

    card.querySelector("[data-edit]").addEventListener("click", event => {
        event.stopPropagation();
        openEditTask(task.id);
    });

    return card;
}

function isOverdue(task) {
    if (!task.dueDate || task.status === "done") {
        return false;
    }

    const today = new Date().toISOString().split("T")[0];

    return task.dueDate < today;
}

function formatDate(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });
}

function openNewTask(status = "todo") {
    taskForm.reset();

    taskId.value = "";
    document.getElementById("modalTitle").textContent = "Create New Task";

    renderProjectOptions();

    taskProject.value =
        currentProject !== "all" ? currentProject : projects[0]?.id || "";

    taskStatus.value = status;
    taskPriority.value = "medium";

    taskModal.classList.add("show");

    setTimeout(() => taskTitle.focus(), 100);
}

function openEditTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) {
        return;
    }

    renderProjectOptions();

    taskId.value = task.id;
    taskTitle.value = task.title;
    taskDescription.value = task.description || "";
    taskProject.value = task.projectId;
    taskPriority.value = task.priority;
    taskStatus.value = task.status;
    taskDueDate.value = task.dueDate || "";

    document.getElementById("modalTitle").textContent = "Edit Task";

    taskModal.classList.add("show");
}

function closeTaskModal() {
    taskModal.classList.remove("show");
}

function openProjectModal() {
    projectForm.reset();
    projectModal.classList.add("show");

    setTimeout(() => {
        document.getElementById("projectName").focus();
    }, 100);
}

function closeProjectModal() {
    projectModal.classList.remove("show");
}

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const existingId = taskId.value;

    const taskData = {
        title: taskTitle.value.trim(),
        description: taskDescription.value.trim(),
        projectId: taskProject.value,
        priority: taskPriority.value,
        status: taskStatus.value,
        dueDate: taskDueDate.value
    };

    if (!taskData.title) {
        return;
    }

    if (existingId) {
        const task = tasks.find(item => item.id === existingId);

        if (task) {
            Object.assign(task, taskData);
            showToast("Task updated successfully");
        }
    } else {
        tasks.push({
            id: "task-" + Date.now(),
            ...taskData,
            createdAt: Date.now()
        });

        showToast("Task created successfully");
    }

    saveData();

    closeTaskModal();
    renderAll();
});

projectForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("projectName").value.trim();

    if (!name) {
        return;
    }

    const color =
        document.querySelector('input[name="projectColor"]:checked').value;

    const project = {
        id: "project-" + Date.now(),
        name,
        color
    };

    projects.push(project);

    saveData();

    currentProject = project.id;
    currentView = "board";

    closeProjectModal();

    renderAll();

    showToast("Project created successfully");
});

document.getElementById("addProjectBtn").addEventListener(
    "click",
    openProjectModal
);

document.getElementById("closeProjectModal").addEventListener(
    "click",
    closeProjectModal
);

document.getElementById("cancelProject").addEventListener(
    "click",
    closeProjectModal
);

document.getElementById("closeTaskModal").addEventListener(
    "click",
    closeTaskModal
);

document.getElementById("cancelTask").addEventListener(
    "click",
    closeTaskModal
);

document.getElementById("dashboardAddTask").addEventListener(
    "click",
    () => openNewTask()
);

document.getElementById("boardAddTask").addEventListener(
    "click",
    () => openNewTask()
);

document.querySelectorAll(".add-column-task").forEach(button => {
    button.addEventListener("click", () => {
        openNewTask(button.dataset.status);
    });
});

document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
        currentView = button.dataset.view;

        if (currentView === "dashboard") {
            currentProject = "all";
        }

        updateView();
        renderProjects();
        renderBoard();
    });
});

document.getElementById("viewBoardBtn").addEventListener("click", () => {
    currentView = "board";
    updateView();
});

function updateView() {
    if (currentView === "dashboard") {
        dashboardView.classList.remove("hidden");
        boardView.classList.add("hidden");
    } else {
        dashboardView.classList.add("hidden");
        boardView.classList.remove("hidden");
    }

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.view === currentView
        );
    });
}

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        renderBoard();
    });
});

sortSelect.addEventListener("change", renderBoard);

searchInput.addEventListener("input", event => {
    currentSearch = event.target.value;
    renderBoard();
});

document.querySelectorAll(".kanban-column").forEach(column => {
    column.addEventListener("dragover", event => {
        event.preventDefault();
        column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", event => {
        if (!column.contains(event.relatedTarget)) {
            column.classList.remove("drag-over");
        }
    });

    column.addEventListener("drop", event => {
        event.preventDefault();

        column.classList.remove("drag-over");

        if (!draggedTaskId) {
            return;
        }

        const status = column.dataset.status;

        const task = tasks.find(item => item.id === draggedTaskId);

        if (!task) {
            return;
        }

        task.status = status;

        saveData();
        renderAll();

        showToast("Task moved successfully");
    });
});

document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.focus();
    }

    if (event.key === "Escape") {
        closeTaskModal();
        closeProjectModal();
    }
});

taskModal.addEventListener("click", event => {
    if (event.target === taskModal) {
        closeTaskModal();
    }
});

projectModal.addEventListener("click", event => {
    if (event.target === projectModal) {
        closeProjectModal();
    }
});

document.getElementById("themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    showToast(
        document.body.classList.contains("light-mode")
            ? "Light mode enabled"
            : "Dark mode enabled"
    );
});

function renderAll() {
    renderProjects();
    renderProjectOptions();
    renderStats();
    renderRecentTasks();
    renderBoard();
    updateView();
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}

renderAll();