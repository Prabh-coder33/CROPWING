lucide.createIcons();

// Configuration
const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let authToken = null;

// Check if user is logged in
function checkAuth() {
    authToken = localStorage.getItem('token');
    if (authToken) {
        loadUserProfile();
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
    } else {
        document.getElementById('auth-view').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }
}

// API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }

    return data;
}

// Auth Functions
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const data = await apiCall('/auth/login', 'POST', { email, password });
        localStorage.setItem('token', data.token);
        authToken = data.token;
        errorDiv.classList.add('hidden');
        checkAuth();
        loadDashboard();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');

    try {
        const data = await apiCall('/auth/register', 'POST', { name, email, password });
        localStorage.setItem('token', data.token);
        authToken = data.token;
        errorDiv.classList.add('hidden');
        checkAuth();
        loadDashboard();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    }
});

function showLoginForm() {
    document.getElementById('login-form-container').classList.remove('hidden');
    document.getElementById('register-form-container').classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('login-form-container').classList.add('hidden');
    document.getElementById('register-form-container').classList.remove('hidden');
}

function logout() {
    localStorage.removeItem('token');
    authToken = null;
    currentUser = null;
    checkAuth();
}

// Load User Profile
async function loadUserProfile() {
    try {
        const user = await apiCall('/user/profile');
        currentUser = user;

        document.getElementById('user-name').textContent = user.name;
        document.getElementById('dash-user-name').textContent = user.name;
        document.getElementById('user-role').textContent = user.role;
        document.getElementById('user-avatar').src = user.avatar;
        document.getElementById('user-level').textContent = `Level ${user.level}`;
        document.getElementById('user-xp').textContent = `${user.xp} XP`;
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

// Load Dashboard
async function loadDashboard() {
    try {
        const stats = await apiCall('/user/dashboard');

        document.getElementById('productivity-score').textContent = stats.productivityScore;
        document.getElementById('learning-progress').textContent = stats.learningPathProgress;
        document.getElementById('learning-progress-bar').style.width = `${stats.learningPathProgress}%`;
        document.getElementById('total-ideas').textContent = stats.totalIdeas;
        document.getElementById('enrolled-courses-count').textContent = `${stats.enrolledCourses} courses`;

        // Load achievements
        loadAchievements();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

// Load Achievements
async function loadAchievements() {
    try {
        const achievements = await apiCall('/achievements');
        const container = document.getElementById('achievements-list');

        if (achievements.length === 0) {
            container.innerHTML = '<div class="text-center text-slate-400 py-8">No achievements yet. Keep learning!</div>';
            return;
        }

        container.innerHTML = achievements.slice(0, 3).map(ach => {
            const colors = {
                yellow: 'bg-yellow-100 text-yellow-600',
                blue: 'bg-blue-100 text-blue-600',
                purple: 'bg-purple-100 text-purple-600',
                green: 'bg-green-100 text-green-600'
            };
            return `
                        <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                            <div class="${colors[ach.color] || colors.blue} p-2 rounded-lg flex-shrink-0">
                                <i data-lucide="${ach.icon}" class="h-5 w-5"></i>
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-slate-800">${ach.name}</h4>
                                <p class="text-xs text-slate-500 mt-0.5">${ach.description}</p>
                            </div>
                        </div>
                    `;
        }).join('');

        lucide.createIcons();
    } catch (error) {
        console.error('Failed to load achievements:', error);
    }
}

// Load Courses
async function loadCourses() {
    try {
        const courses = await apiCall('/courses');
        const container = document.getElementById('courses-list');

        if (courses.length === 0) {
            container.innerHTML = '<div class="text-center text-slate-400 py-8">No courses available</div>';
            return;
        }

        container.innerHTML = courses.map(course => {
            const gradients = {
                'from-indigo-500 to-blue-600': 'bg-gradient-to-br from-indigo-500 to-blue-600',
                'from-orange-400 to-pink-500': 'bg-gradient-to-br from-orange-400 to-pink-500',
                'from-green-400 to-teal-500': 'bg-gradient-to-br from-green-400 to-teal-500'
            };

            const isLocked = course.isLocked;
            const isEnrolled = course.isEnrolled;
            const progress = course.userProgress || 0;

            return `
                        <div class="bg-white rounded-xl p-1 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group ${isLocked ? 'opacity-75' : ''}">
                            <div class="flex flex-col md:flex-row p-5 gap-6">
                                <div class="h-32 w-full md:w-48 ${isLocked ? 'bg-slate-100' : gradients[course.gradient] || gradients['from-indigo-500 to-blue-600']} rounded-lg flex items-center justify-center text-white shadow-inner relative overflow-hidden">
                                    <i data-lucide="${isLocked ? 'lock' : course.icon}" class="h-12 w-12 ${isLocked ? 'text-slate-400' : 'relative z-10'}"></i>
                                    ${!isLocked ? '<div class="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>' : ''}
                                </div>
                                <div class="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div class="flex items-center gap-2 mb-2">
                                            <span class="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-100">${course.category}</span>
                                        </div>
                                        <h3 class="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">${course.title}</h3>
                                        <p class="text-slate-500 text-sm mt-2 line-clamp-2">${course.description}</p>
                                    </div>
                                    <div class="flex items-center gap-6 mt-4">
                                        <div class="flex items-center gap-1.5 text-slate-500 text-sm">
                                            <i data-lucide="clock" class="h-4 w-4"></i> ${course.duration}
                                        </div>
                                        ${!isLocked && course.rating ? `
                                            <div class="flex items-center gap-1.5 text-slate-500 text-sm">
                                                <i data-lucide="star" class="h-4 w-4 text-yellow-400 fill-yellow-400"></i> ${course.rating}
                                            </div>
                                        ` : ''}
                                        ${isEnrolled && progress > 0 ? `
                                            <div class="flex items-center gap-2">
                                                <div class="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                    <div class="bg-indigo-500 h-full" style="width: ${progress}%"></div>
                                                </div>
                                                <span class="text-xs text-slate-500">${progress}%</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="flex flex-col justify-center border-l border-slate-100 pl-0 md:pl-6 mt-4 md:mt-0">
                                    ${isLocked ? `
                                        <button disabled class="bg-slate-100 text-slate-400 cursor-not-allowed px-6 py-2.5 rounded-lg font-medium whitespace-nowrap">
                                            Locked
                                        </button>
                                    ` : isEnrolled ? `
                                        <button onclick="resumeCourse('${course._id}')" class="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap">
                                            Resume
                                        </button>
                                    ` : `
                                        <button onclick="enrollCourse('${course._id}')" class="bg-slate-900 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/30 whitespace-nowrap">
                                            Start Course
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>
                    `;
        }).join('');

        lucide.createIcons();
    } catch (error) {
        console.error('Failed to load courses:', error);
    }
}

// Enroll in Course
async function enrollCourse(courseId) {
    try {
        await apiCall(`/courses/${courseId}/enroll`, 'POST');
        loadCourses();
        showNotification('Enrolled successfully!');
    } catch (error) {
        showNotification('Failed to enroll: ' + error.message, 'error');
    }
}

// Resume Course
function resumeCourse(courseId) {
    showNotification('Opening course player...');
    // In a real app, this would open a course player
}

// Load Ideas
async function loadIdeas() {
    try {
        const ideas = await apiCall('/ideas?sort=trending');
        const container = document.getElementById('ideas-list');

        if (ideas.length === 0) {
            container.innerHTML = '<div class="text-center text-slate-400 py-8">No ideas yet. Be the first to share!</div>';
            return;
        }

        container.innerHTML = ideas.map(idea => {
            const categoryColors = {
                'Process Improvement': 'bg-purple-50 text-purple-700 border-purple-100',
                'Technical Solution': 'bg-blue-50 text-blue-700 border-blue-100',
                'Team Culture': 'bg-green-50 text-green-700 border-green-100'
            };

            return `
                        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center gap-3">
                                    <img src="${idea.author.avatar}" class="h-10 w-10 rounded-full bg-slate-100 border border-slate-200">
                                    <div>
                                        <h3 class="font-bold text-slate-900 text-sm">${idea.author.name}</h3>
                                        <p class="text-xs text-slate-500">${idea.author.role} • ${new Date(idea.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <span class="${categoryColors[idea.category]} text-xs px-2.5 py-0.5 rounded-full font-bold border inline-block mb-2">${idea.category}</span>
                                <h4 class="font-bold text-lg text-slate-800 mb-2">${idea.title}</h4>
                                <p class="text-slate-600 text-sm leading-relaxed">${idea.description}</p>
                            </div>

                            <div class="flex items-center gap-4 border-t border-slate-100 pt-4 mt-4">
                                <button onclick="toggleVote('${idea._id}')" id="vote-btn-${idea._id}" class="group flex items-center gap-2 text-slate-500 text-sm font-medium hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors ${idea.hasVoted ? 'bg-indigo-50' : ''}">
                                    <i data-lucide="thumbs-up" class="h-4 w-4 ${idea.hasVoted ? 'text-indigo-600 fill-indigo-600' : 'group-hover:text-indigo-600'}"></i> 
                                    <span id="vote-count-${idea._id}" class="${idea.hasVoted ? 'text-indigo-600' : 'group-hover:text-indigo-600'}">${idea.voteCount} Votes</span>
                                </button>
                                <button class="flex items-center gap-2 text-slate-500 text-sm font-medium hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                                    <i data-lucide="message-circle" class="h-4 w-4"></i> ${idea.commentCount} Comments
                                </button>
                            </div>
                        </div>
                    `;
        }).join('');

        lucide.createIcons();
    } catch (error) {
        console.error('Failed to load ideas:', error);
    }
}

// Toggle Vote
async function toggleVote(ideaId) {
    try {
        const result = await apiCall(`/ideas/${ideaId}/vote`, 'POST');
        const btn = document.getElementById(`vote-btn-${ideaId}`);
        const countSpan = document.getElementById(`vote-count-${ideaId}`);
        const icon = btn.querySelector('i');

        if (result.hasVoted) {
            btn.classList.add('bg-indigo-50');
            icon.classList.add('text-indigo-600', 'fill-indigo-600');
            countSpan.classList.add('text-indigo-600');
        } else {
            btn.classList.remove('bg-indigo-50');
            icon.classList.remove('text-indigo-600', 'fill-indigo-600');
            countSpan.classList.remove('text-indigo-600');
        }

        countSpan.textContent = `${result.voteCount} Votes`;
    } catch (error) {
        showNotification('Failed to vote: ' + error.message, 'error');
    }
}

// Submit Idea
document.getElementById('idea-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('idea-title').value;
    const category = document.getElementById('idea-category').value;
    const description = document.getElementById('idea-description').value;
    const errorDiv = document.getElementById('idea-error');

    try {
        await apiCall('/ideas', 'POST', { title, category, description });
        closeModal('idea-modal');
        showNotification('Idea submitted successfully!');
        if (document.getElementById('team-view').classList.contains('hidden') === false) {
            loadIdeas();
        }
        document.getElementById('idea-form').reset();
        errorDiv.classList.add('hidden');
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    }
});

// Chat Functions
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatContainer = document.getElementById('chat-container');

function prefillChat(text) {
    chatInput.value = text;
    chatInput.focus();
}

chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage(message, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    const loadingId = showTypingIndicator();

    try {
        const result = await apiCall('/chat', 'POST', { message });
        removeTypingIndicator(loadingId);
        appendMessage(result.response, 'bot');
    } catch (error) {
        removeTypingIndicator(loadingId);
        appendMessage('Sorry, I encountered an error. Please try again.', 'bot');
    }
});

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'flex items-start gap-4 max-w-2xl animate-pulse';
    div.innerHTML = `
                <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 border border-indigo-200">
                    <i data-lucide="bot" class="h-4 w-4 text-indigo-600"></i>
                </div>
                <div class="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <div class="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    <div class="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
            `;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    lucide.createIcons();
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

function appendMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `flex items-start gap-4 max-w-2xl ${sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`;

    const avatar = sender === 'user'
        ? `<div class="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md"><img src="${currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'}" /></div>`
        : `<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 border border-indigo-200"><i data-lucide="bot" class="h-4 w-4"></i></div>`;

    const bubbleStyle = sender === 'user'
        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none shadow-md shadow-indigo-200'
        : 'bg-slate-100 text-slate-700 rounded-2xl rounded-tl-none';

    div.innerHTML = `
                ${avatar}
                <div class="flex flex-col gap-1 ${sender === 'user' ? 'items-end' : 'items-start'}">
                    <span class="text-xs font-bold text-slate-400 mx-1">${sender === 'user' ? 'You' : 'Nexus AI'}</span>
                    <div class="${bubbleStyle} p-3 text-sm leading-relaxed">
                        ${text}
                    </div>
                </div>
            `;

    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    if (sender === 'bot') lucide.createIcons();
}

// Navigation
function showView(viewId) {
    ['dashboard', 'training', 'assistant', 'team'].forEach(id => {
        document.getElementById(`${id}-view`).classList.add('hidden');
        const navItem = document.getElementById(`nav-${id}`);
        if (navItem) {
            navItem.classList.remove('active');
            const icon = navItem.querySelector('i');
            if (icon) icon.classList.add('text-slate-400');
        }
    });

    document.getElementById(`${viewId}-view`).classList.remove('hidden');

    const titles = {
        'dashboard': 'Overview Dashboard',
        'training': 'Skill Development',
        'assistant': 'AI Assistant',
        'team': 'Collaboration Hub'
    };
    document.getElementById('page-title').innerText = titles[viewId];

    const activeNav = document.getElementById(`nav-${viewId}`);
    if (activeNav) {
        activeNav.classList.add('active');
        const icon = activeNav.querySelector('i');
        if (icon) icon.classList.remove('text-slate-400');
    }

    // Load data for specific views
    if (viewId === 'training') loadCourses();
    if (viewId === 'team') loadIdeas();

    lucide.createIcons();
}

// Modal Functions
function showModal(id) {
    document.getElementById(id).classList.remove('hidden');
    lucide.createIcons();
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// Notification
function showNotification(message, type = 'success') {
    const div = document.createElement('div');
    div.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white font-medium fade-in`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// Initialize
checkAuth();