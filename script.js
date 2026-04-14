// Data Store (Utilizing LocalStorage)
let posts = JSON.parse(localStorage.getItem('fyf_posts')) || [];
let events = JSON.parse(localStorage.getItem('fyf_events')) || [];

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const sections = document.querySelectorAll('.content-section');
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const eventModal = document.getElementById('eventModal');
const postModal = document.getElementById('postModal');
const closeModals = document.querySelectorAll('.close-modal');

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Generate some initial mock data if empty
    if(posts.length === 0) populateMockData();
    renderPhotostream();
    renderEvents();
});

// Tab Navigation logic
tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.add('active');
    });
});

// Modal Actions
uploadBtn.addEventListener('click', () => uploadModal.classList.add('active'));
document.getElementById('addEventBtn').addEventListener('click', () => eventModal.classList.add('active'));

closeModals.forEach(btn => {
    btn.addEventListener('click', () => {
        uploadModal.classList.remove('active');
        eventModal.classList.remove('active');
        postModal.classList.remove('active');
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Media Upload Logic
const uploadForm = document.getElementById('uploadForm');
uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('mediaFile');
    const caption = document.getElementById('mediaCaption').value;
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            const newPost = {
                id: Date.now().toString(),
                type: file.type.startsWith('video') ? 'video' : (file.type.startsWith('audio') ? 'audio' : 'image'),
                src: dataUrl,
                caption: caption,
                date: new Date().toLocaleDateString(),
                comments: []
            };
            
            posts.unshift(newPost); // Add to beginning
            savePosts();
            renderPhotostream();
            uploadModal.classList.remove('active');
            uploadForm.reset();
        };
        reader.readAsDataURL(file);
    }
});

// Event Creation Logic
const eventForm = document.getElementById('eventForm');
eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('eventName').value;
    const date = document.getElementById('eventDate').value;
    const desc = document.getElementById('eventDesc').value;
    
    events.push({
        id: Date.now().toString(),
        name,
        date: new Date(date).toISOString(), // Standardize
        desc
    });
    
    // Sort events by date
    events.sort((a,b) => new Date(a.date) - new Date(b.date));
    
    saveEvents();
    renderEvents();
    eventModal.classList.remove('active');
    eventForm.reset();
});

// Render Photostream (Masonry style Grid)
function renderPhotostream() {
    const grid = document.getElementById('media-grid');
    grid.innerHTML = ''; // Clear current
    
    posts.forEach(post => {
        const item = document.createElement('div');
        item.className = 'media-item';
        item.onclick = () => openPostModal(post);
        
        let mediaHtml = '';
        if (post.type === 'video') {
            mediaHtml = `<video src="${post.src}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;
        } else if (post.type === 'audio') {
            mediaHtml = `<div style="padding:40px;text-align:center;background:#eee;height:100%;display:flex;align-items:center;justify-content:center;">🎤 Audio Post</div>`;
        } else {
            mediaHtml = `<img src="${post.src}" alt="${post.caption}">`;
        }
        
        item.innerHTML = `
            ${mediaHtml}
            <div class="media-overlay">
                <div>${post.caption}</div>
                <div style="font-size:12px;margin-top:5px">💬 ${post.comments.length} comments</div>
            </div>
        `;
        grid.appendChild(item);
    });
}

// Render Events List
function renderEvents() {
    const list = document.getElementById('events-list');
    list.innerHTML = '';
    
    if(events.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#777;">No upcoming events. Create one!</p>`;
        return;
    }

    events.forEach(ev => {
        const dateObj = new Date(ev.date);
        const month = dateObj.toLocaleString('default', { month: 'short' });
        const day = dateObj.getDate();
        
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="event-date-box">
                <span class="month">${month}</span>
                <span class="day">${day}</span>
            </div>
            <div class="event-details">
                <h3 style="margin-bottom:5px">${ev.name}</h3>
                <p style="color:#666; font-size:14px">${ev.desc}</p>
            </div>
        `;
        list.appendChild(card);
    });
}

// Post Modal & Commenting Logic
let currentPostId = null;

function openPostModal(post) {
    currentPostId = post.id;
    const mediaContainer = document.getElementById('postMediaDisplay');
    const captionDisplay = document.getElementById('postCaptionDisplay');
    const dateDisplay = document.getElementById('postDateDisplay');
    
    // Set Media
    if(post.type === 'video') {
        mediaContainer.innerHTML = `<video src="${post.src}" controls autoplay style="height:100%;width:100%"></video>`;
    } else if (post.type === 'audio') {
        mediaContainer.innerHTML = `<audio src="${post.src}" controls></audio>`;
    } else {
        mediaContainer.innerHTML = `<img src="${post.src}" alt="">`;
    }
    
    captionDisplay.textContent = post.caption;
    dateDisplay.textContent = `Posted on ${post.date}`;
    
    renderComments();
    postModal.classList.add('active');
}

document.getElementById('postCommentBtn').addEventListener('click', addComment);
document.getElementById('newCommentInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') addComment();
});

function addComment() {
    const input = document.getElementById('newCommentInput');
    const text = input.value.trim();
    if(!text) return;
    
    const postIndex = posts.findIndex(p => p.id === currentPostId);
    if(postIndex > -1) {
        posts[postIndex].comments.push({
            author: "Anonymous User",
            text: text,
            date: new Date().toLocaleDateString()
        });
        savePosts();
        renderComments(); // Refresh UI
        renderPhotostream(); // Update comment counts on grid
        input.value = '';
    }
}

function renderComments() {
    const section = document.getElementById('commentsSection');
    const post = posts.find(p => p.id === currentPostId);
    if(!post) return;
    
    section.innerHTML = '';
    if(post.comments.length === 0) {
        section.innerHTML = `<div style="text-align:center;color:#888;font-size:14px;margin-top:20px;">No comments yet.</div>`;
    } else {
        post.comments.forEach(c => {
            const div = document.createElement('div');
            div.className = 'comment';
            div.innerHTML = `
                <span class="comment-author">${c.author} <span style="font-size:11px;color:#aaa;font-weight:400">${c.date}</span></span>
                <span class="comment-text">${c.text}</span>
            `;
            section.appendChild(div);
        });
    }
    // Scroll to bottom
    section.scrollTop = section.scrollHeight;
}

// Helpers
function savePosts() { localStorage.setItem('fyf_posts', JSON.stringify(posts)); }
function saveEvents() { localStorage.setItem('fyf_events', JSON.stringify(events)); }

function populateMockData() {
    posts = [
        {
            id: '1',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop',
            caption: 'Youth Gala 2025!',
            date: '4/14/2026',
            comments: [{author:'Admin', text:'What a fantastic night!', date:'4/14/2026'}]
        },
        {
            id: '2',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop',
            caption: 'Community Outreach gathering.',
            date: '4/10/2026',
            comments: []
        },
        {
            id: '3',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=800&auto=format&fit=crop',
            caption: 'Planning session for summer camp.',
            date: '4/01/2026',
            comments: []
        }
    ];
    savePosts();
}
