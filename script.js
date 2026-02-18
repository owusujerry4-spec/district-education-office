if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        let el = this;
        while (el && el !== document) {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        }
        return null;
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const commentForms = document.querySelectorAll('.comment-form');
    const backToTopButton = document.getElementById('back-to-top');
    const dropdown = document.querySelector('.dropdown');
    const dropdownContent = document.querySelector('.dropdown-content');
    const resourceForm = document.getElementById('resource-form');
    const resourceList = document.querySelector('.resource-items');
    const slideshowImageForm = document.getElementById('slideshow-image-form');
    const slideshowImageList = document.querySelector('.slideshow-image-items');
    const authButton = document.getElementById('auth-button');
    const adminPassword = document.getElementById('admin-password');
    const ADMIN_PASSWORD = 'admin123';
    let isAdminAuthenticated = false;

    // Staff Portal Functionality
    const staffLoginForm = document.getElementById('staff-login-form');
    const staffAuth = document.getElementById('staff-auth');
    const portalDashboard = document.getElementById('portal-dashboard');
    const authMessage = document.getElementById('auth-message');
    const logoutButton = document.getElementById('logout-button');
    const STAFF_PASSWORD = 'staff2025'; // Simple hardcoded password for demo
    let isStaffAuthenticated = false;

    // Geolocation and Map Functionality
    const getLocationButton = document.getElementById('get-location');
    const resetMapButton = document.getElementById('reset-map');
    const geolocationMessage = document.getElementById('geolocation-message');
    const contactMap = document.getElementById('contact-map');
    let map, directorateMarker, userMarker;

    // Add fade-in effect on page load
    document.body.classList.add('fade-in');
    setTimeout(() => {
        document.body.classList.remove('fade-in');
        document.body.classList.add('fade-in-complete');
    }, 50);

    // Handle smooth page transitions for navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.classList.contains('dropbtn') && window.innerWidth <= 768) {
                return;
            }
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                return;
            }
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });

    // Handle comments (only on gallery page)
    if (commentForms.length > 0) {
        commentForms.forEach(form => {
            const commentList = form.previousElementSibling;
            const activityId = form.dataset.id;

            loadComments(activityId, commentList);

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const textarea = form.querySelector('textarea');
                const commentText = textarea.value.trim();

                if (commentText) {
                    addComment(activityId, commentText, commentList);
                    textarea.value = '';
                }
            });
        });
    }

    // Back to Top button functionality
    if (backToTopButton) {
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Dropdown toggle for mobile/small screens with touch support
    if (dropdown && dropdownContent) {
        dropdown.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
            }
        });

        dropdown.addEventListener('touchstart', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
            }
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && window.innerWidth <= 768) {
                dropdownContent.style.display = 'none';
            }
        });

        document.addEventListener('touchend', (e) => {
            if (!dropdown.contains(e.target) && window.innerWidth <= 768) {
                dropdownContent.style.display = 'none';
            }
        });
    }

    // Handle admin authentication (for both resources and slideshow images)
    if (authButton && adminPassword) {
        authButton.addEventListener('click', () => {
            if (adminPassword.value === ADMIN_PASSWORD) {
                isAdminAuthenticated = true;
                resourceForm.style.display = 'block';
                slideshowImageForm.style.display = 'block';
                document.getElementById('admin-auth').style.display = 'none';
                document.querySelectorAll('.delete-button').forEach(button => {
                    button.style.display = 'block';
                });
            } else {
                alert('Incorrect password. Please try again.');
            }
        });
    }

    // Load slideshow images on homepage
    const slideshow = document.querySelector('.cb-slideshow');
    if (slideshow) {
        loadSlideshowImages(slideshow);
    }

    // Handle PDF resource uploads
    if (resourceList) {
        loadResources(resourceList);
    }

    if (resourceForm) {
        resourceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!isAdminAuthenticated) {
                alert('Please authenticate as admin to upload resources.');
                return;
            }
            const fileInput = document.getElementById('resource-file');
            const descriptionInput = document.getElementById('resource-description');
            const file = fileInput.files[0];
            const description = descriptionInput.value.trim();

            if (file && description && file.type === 'application/pdf') {
                const reader = new FileReader();
                reader.onload = () => {
                    const resourceId = Date.now().toString();
                    const resource = {
                        id: resourceId,
                        name: file.name,
                        description: description,
                        dataUrl: reader.result
                    };

                    let resources = [];
                    if (typeof localStorage !== 'undefined') {
                        resources = JSON.parse(localStorage.getItem('resources') || '[]');
                        resources.push(resource);
                        localStorage.setItem('resources', JSON.stringify(resources));
                    }

                    addResource(resource, resourceList, isAdminAuthenticated);
                    resourceForm.reset();
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select a PDF file and provide a description.');
            }
        });
    }

    // Handle slideshow image uploads
    if (slideshowImageList) {
        loadSlideshowImagesList(slideshowImageList);
    }

    if (slideshowImageForm) {
        slideshowImageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!isAdminAuthenticated) {
                alert('Please authenticate as admin to upload slideshow images.');
                return;
            }
            const fileInput = document.getElementById('slideshow-image-file');
            const descriptionInput = document.getElementById('slideshow-image-description');
            const file = fileInput.files[0];
            const description = descriptionInput.value.trim();

            if (file && description && (file.type === 'image/jpeg' || file.type === 'image/png')) {
                const reader = new FileReader();
                reader.onload = () => {
                    const imageId = Date.now().toString();
                    const image = {
                        id: imageId,
                        name: file.name,
                        description: description,
                        dataUrl: reader.result
                    };

                    let images = [];
                    if (typeof localStorage !== 'undefined') {
                        images = JSON.parse(localStorage.getItem('slideshowImages') || '[]');
                        images.push(image);
                        localStorage.setItem('slideshowImages', JSON.stringify(images));
                    }

                    addSlideshowImage(image, slideshowImageList, isAdminAuthenticated);
                    slideshowImageForm.reset();

                    // Reload slideshow images on homepage if on index.html
                    if (slideshow) {
                        loadSlideshowImages(slideshow);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select a JPEG or PNG image and provide a description.');
            }
        });
    }

    // Handle resource and slideshow image downloads and deletions
    if (resourceList) {
        resourceList.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'A') {
                e.preventDefault();
                const resourceId = target.dataset.id;
                const resources = JSON.parse(localStorage.getItem('resources') || '[]');
                const resource = resources.find(r => r.id === resourceId);
                if (resource) {
                    const link = document.createElement('a');
                    link.href = resource.dataUrl;
                    link.download = resource.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else if (target.classList.contains('delete-button') && isAdminAuthenticated) {
                const resourceId = target.dataset.id;
                let resources = JSON.parse(localStorage.getItem('resources') || '[]');
                resources = resources.filter(r => r.id !== resourceId);
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('resources', JSON.stringify(resources));
                }
                target.closest('li').remove();
            }
        });
    }

    if (slideshowImageList) {
        slideshowImageList.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'A') {
                e.preventDefault();
                const imageId = target.dataset.id;
                const images = JSON.parse(localStorage.getItem('slideshowImages') || '[]');
                const image = images.find(img => img.id === imageId);
                if (image) {
                    const link = document.createElement('a');
                    link.href = image.dataUrl;
                    link.download = image.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else if (target.classList.contains('delete-button') && isAdminAuthenticated) {
                const imageId = target.dataset.id;
                let images = JSON.parse(localStorage.getItem('slideshowImages') || '[]');
                images = images.filter(img => img.id !== imageId);
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('slideshowImages', JSON.stringify(images));
                }
                target.closest('li').remove();
                // Reload slideshow images on homepage if on index.html
                if (slideshow) {
                    loadSlideshowImages(slideshow);
                }
            }
        });
    }

    // Staff Portal Authentication
    if (staffLoginForm) {
        staffLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('staff-username').value.trim();
            const password = document.getElementById('staff-password').value.trim();

            // Simple demo authentication - in production, use secure server-side auth
            if (password === STAFF_PASSWORD && username) {
                isStaffAuthenticated = true;
                staffAuth.style.display = 'none';
                portalDashboard.style.display = 'block';
                authMessage.textContent = 'Login successful! Welcome to the Staff Portal.';
                authMessage.className = 'success';
                loadPortalData();
                staffLoginForm.reset();
            } else {
                authMessage.textContent = 'Invalid credentials. Please try again.';
                authMessage.className = 'error';
            }
        });

        // Logout functionality
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                isStaffAuthenticated = false;
                staffAuth.style.display = 'block';
                portalDashboard.style.display = 'none';
                authMessage.textContent = '';
                authMessage.className = '';
            });
        }
    }

    // Interactive Map Setup
    if (contactMap) {
        // Approximate coordinates for Offinso North, Akomadan (based on general area, as GPS address A6-0008-5006 is not directly mappable)
        const defaultLatLng = [7.4000, -1.9667]; // Approximate coordinates for Akomadan, Ashanti, Ghana
        map = L.map('contact-map').setView(defaultLatLng, 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        // Add marker for Offinso North Education Directorate
        directorateMarker = L.marker(defaultLatLng).addTo(map)
            .bindPopup('Offinso North Education Directorate<br>Akomadan, Ashanti')
            .openPopup();

        // Handle map click to add a temporary marker
        map.on('click', (e) => {
            if (userMarker) {
                map.removeLayer(userMarker);
            }
            userMarker = L.marker(e.latlng).addTo(map)
                .bindPopup(`Clicked Location: Lat ${e.latlng.lat.toFixed(4)}, Lng ${e.latlng.lng.toFixed(4)}`)
                .openPopup();
            geolocationMessage.textContent = `Clicked Location: Latitude ${e.latlng.lat.toFixed(4)}, Longitude ${e.latlng.lng.toFixed(4)}`;
            geolocationMessage.className = '';
        });
    }

    // Geolocation handling
    if (getLocationButton && geolocationMessage && contactMap) {
        getLocationButton.addEventListener('click', () => {
            if (navigator.geolocation) {
                geolocationMessage.textContent = 'Retrieving your location...';
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        if (userMarker) {
                            map.removeLayer(userMarker);
                        }
                        userMarker = L.marker([latitude, longitude]).addTo(map)
                            .bindPopup(`Your Location: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`)
                            .openPopup();
                        map.setView([latitude, longitude], 13);
                        geolocationMessage.textContent = `Your Location: Latitude ${latitude.toFixed(4)}, Longitude ${longitude.toFixed(4)}`;
                        geolocationMessage.className = '';
                    },
                    (error) => {
                        let errorMessage = 'Unable to retrieve location.';
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = 'Location access denied. Please enable location services.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = 'Location information is unavailable.';
                                break;
                            case error.TIMEOUT:
                                errorMessage = 'The request to get location timed out.';
                                break;
                        }
                        geolocationMessage.textContent = errorMessage;
                        geolocationMessage.className = 'error';
                    }
                );
            } else {
                geolocationMessage.textContent = 'Geolocation is not supported by this browser.';
                geolocationMessage.className = 'error';
            }
        });

        // Reset map to default location
        if (resetMapButton) {
            resetMapButton.addEventListener('click', () => {
                map.setView(defaultLatLng, 13);
                if (userMarker) {
                    map.removeLayer(userMarker);
                    userMarker = null;
                }
                directorateMarker.openPopup();
                geolocationMessage.textContent = 'Showing Offinso North Education Directorate location.';
                geolocationMessage.className = '';
            });
        }
    }

    // Staff Portal Data Handling
    function loadPortalData() {
        loadMessages();
        loadReports();
        loadDataSubmissions();
    }

    function loadMessages() {
        const messagesList = document.getElementById('messages-list');
        if (messagesList && typeof localStorage !== 'undefined') {
            const messages = JSON.parse(localStorage.getItem('staffMessages') || '[]');
            messagesList.innerHTML = '';
            messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = 'message-item';
                div.innerHTML = `<strong>${msg.author}:</strong> ${msg.text} <small>(${new Date(msg.timestamp).toLocaleString()})</small>`;
                messagesList.appendChild(div);
            });
        }
    }

    function loadReports() {
        const reportsList = document.getElementById('reports-list');
        if (reportsList && typeof localStorage !== 'undefined') {
            const reports = JSON.parse(localStorage.getItem('staffReports') || '[]');
            reportsList.innerHTML = '';
            reports.forEach(report => {
                const div = document.createElement('div');
                div.className = 'report-item';
                div.innerHTML = `<h5>${report.title}</h5><p>${report.content}</p><small>Submitted: ${new Date(report.timestamp).toLocaleString()}</small>`;
                reportsList.appendChild(div);
            });
        }
    }

    function loadDataSubmissions() {
        const submissionsList = document.getElementById('data-submissions-list');
        if (submissionsList && typeof localStorage !== 'undefined') {
            const submissions = JSON.parse(localStorage.getItem('staffDataSubmissions') || '[]');
            submissionsList.innerHTML = '';
            submissions.forEach(sub => {
                const div = document.createElement('div');
                div.className = 'data-item';
                div.innerHTML = `<strong>Type:</strong> ${sub.type}<br><strong>File:</strong> ${sub.fileName}<br><strong>Description:</strong> ${sub.description || 'N/A'}<br><small>Submitted: ${new Date(sub.timestamp).toLocaleString()}</small>`;
                submissionsList.appendChild(div);
            });
        }
    }

    // Send Message
    const sendMessageForm = document.getElementById('send-message-form');
    if (sendMessageForm) {
        sendMessageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!isStaffAuthenticated) return;
            const text = document.getElementById('message-text').value.trim();
            const username = document.getElementById('staff-username').value.trim() || 'Anonymous';
            if (text) {
                const message = {
                    author: username,
                    text: text,
                    timestamp: Date.now()
                };
                let messages = [];
                if (typeof localStorage !== 'undefined') {
                    messages = JSON.parse(localStorage.getItem('staffMessages') || '[]');
                    messages.push(message);
                    localStorage.setItem('staffMessages', JSON.stringify(messages));
                }
                loadMessages();
                sendMessageForm.reset();
            }
        });
    }

    // Submit Report
    const submitReportForm = document.getElementById('submit-report-form');
    if (submitReportForm) {
        submitReportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!isStaffAuthenticated) return;
            const title = document.getElementById('report-title').value.trim();
            const content = document.getElementById('report-content').value.trim();
            if (title && content) {
                const report = {
                    title: title,
                    content: content,
                    timestamp: Date.now()
                };
                let reports = [];
                if (typeof localStorage !== 'undefined') {
                    reports = JSON.parse(localStorage.getItem('staffReports') || '[]');
                    reports.push(report);
                    localStorage.setItem('staffReports', JSON.stringify(reports));
                }
                loadReports();
                submitReportForm.reset();
                alert('Report submitted successfully!');
            }
        });
    }

    // Submit Data
    const submitDataForm = document.getElementById('submit-data-form');
    if (submitDataForm) {
        submitDataForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!isStaffAuthenticated) return;
            const type = document.getElementById('data-type').value;
            const file = document.getElementById('data-file').files[0];
            const description = document.getElementById('data-description').value.trim();
            if (type && file) {
                // For demo, just store filename; in production, upload to server
                const submission = {
                    type: type,
                    fileName: file.name,
                    description: description,
                    timestamp: Date.now()
                };
                let submissions = [];
                if (typeof localStorage !== 'undefined') {
                    submissions = JSON.parse(localStorage.getItem('staffDataSubmissions') || '[]');
                    submissions.push(submission);
                    localStorage.setItem('staffDataSubmissions', JSON.stringify(submissions));
                }
                loadDataSubmissions();
                submitDataForm.reset();
                alert('Data submitted successfully!');
            }
        });
    }
});

// Existing functions remain the same...
function addComment(activityId, text, list) {
    const li = document.createElement('li');
    li.textContent = text;
    list.appendChild(li);

    if (typeof localStorage !== 'undefined') {
        const comments = JSON.parse(localStorage.getItem(`comments_${activityId}`) || '[]');
        comments.push(text);
        localStorage.setItem(`comments_${activityId}`, JSON.stringify(comments));
    }
}

function loadComments(activityId, list) {
    if (typeof localStorage !== 'undefined') {
        const comments = JSON.parse(localStorage.getItem(`comments_${activityId}`) || '[]');
        comments.forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            list.appendChild(li);
        });
    }
}

function addResource(resource, list, isAdminAuthenticated) {
    const li = document.createElement('li');
    li.innerHTML = `
        <a href="#" data-id="${resource.id}" role="link" aria-label="Download ${resource.name}">${resource.name}</a>
        <p>${resource.description}</p>
        <button class="delete-button" data-id="${resource.id}" style="display: ${isAdminAuthenticated ? 'block' : 'none'};" aria-label="Delete ${resource.name}">Delete</button>
    `;
    list.appendChild(li);
}

function loadResources(list) {
    if (typeof localStorage !== 'undefined') {
        const resources = JSON.parse(localStorage.getItem('resources') || '[]');
        resources.forEach(resource => {
            addResource(resource, list, false);
        });
    }
}

function addSlideshowImage(image, list, isAdminAuthenticated) {
    const li = document.createElement('li');
    li.innerHTML = `
        <a href="#" data-id="${image.id}" role="link" aria-label="Download ${image.name}">${image.name}</a>
        <img src="${image.dataUrl}" alt="${image.description}" aria-label="Preview of ${image.name}">
        <p>${image.description}</p>
        <button class="delete-button" data-id="${image.id}" style="display: ${isAdminAuthenticated ? 'block' : 'none'};" aria-label="Delete ${image.name}">Delete</button>
    `;
    list.appendChild(li);
}

function loadSlideshowImagesList(list) {
    if (typeof localStorage !== 'undefined') {
        const images = JSON.parse(localStorage.getItem('slideshowImages') || '[]');
        images.forEach(image => {
            addSlideshowImage(image, list, false);
        });
    }
}
// these are the codes and control panel for the default home images
function loadSlideshowImages(slideshow) {
    const defaultImages = [
        'pic3.jpeg',
        'pic4.jpeg',
        'pic2.jpeg',
        'pic1.jpeg',
        'pic5.jpeg',
        'new.jpeg',
    ];
    let images = [];
    if (typeof localStorage !== 'undefined') {
        images = JSON.parse(localStorage.getItem('slideshowImages') || '[]');
    }
    const slides = slideshow.querySelectorAll('li span');
    const selectedImages = images.slice(-4); // Take the last 4 images
    slides.forEach((span, index) => {
        if (selectedImages[index]) {
            span.style.backgroundImage = `url(${selectedImages[index].dataUrl})`;
        } else {
            span.style.backgroundImage = `url(${defaultImages[index]})`;
        }
    });
}