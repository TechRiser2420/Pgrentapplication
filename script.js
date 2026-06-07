/**
 * PGSmart Rental Application - PG Rental Management System
 * Client-Side JavaScript Logic
 */

// Initialize Database State from LocalStorage or Default Mock Data
let state = {
    tenants: [],
    rooms: [],
    complaints: [],
    settings: {
        theme: 'dark',
        accentColor: 'cyan',
        pgName: 'PGSmart Rental Application',
        tagline: 'Smart Living. Smart Management.',
        upiId: 'pgsmart@upi'
    }
};

let currentUser = null;
let usersList = [];

const DEFAULT_ROOMS = [
    { roomNumber: "101", type: "Single", ac: true, rent: 15000, floor: 1, capacity: 1, occupiedBeds: 1 },
    { roomNumber: "102", type: "Double Sharing", ac: false, rent: 8500, floor: 1, capacity: 2, occupiedBeds: 1 },
    { roomNumber: "103", type: "Double Sharing", ac: true, rent: 11000, floor: 1, capacity: 2, occupiedBeds: 2 },
    { roomNumber: "104", type: "Triple Sharing", ac: false, rent: 6000, floor: 1, capacity: 3, occupiedBeds: 0 },
    { roomNumber: "201", type: "Single", ac: true, rent: 16000, floor: 2, capacity: 1, occupiedBeds: 1 },
    { roomNumber: "202", type: "Double Sharing", ac: true, rent: 12000, floor: 2, capacity: 2, occupiedBeds: 0 }
];

const DEFAULT_TENANTS = [
    {
        id: "T-001",
        name: "Aarav Sharma",
        phone: "9876543210",
        aadhaar: "1234-5678-9012",
        room: "101",
        rent: 15000,
        joiningDate: "2026-01-10",
        advance: 15000,
        due: 0,
        status: "Paid",
        occupation: "Software Eng @ Adobe",
        paymentDate: "2026-05-01",
        notes: "Paid online via GPay"
    },
    {
        id: "T-002",
        name: "Kabir Mehta",
        phone: "9812345670",
        aadhaar: "4321-8765-2109",
        room: "102",
        rent: 8500,
        joiningDate: "2026-02-15",
        advance: 8500,
        due: 8500,
        status: "Pending",
        occupation: "Consultant @ EY",
        paymentDate: "",
        notes: "Awaits salary cycle on 5th"
    },
    {
        id: "T-003",
        name: "Riya Sen",
        phone: "9988776655",
        aadhaar: "9876-1234-5678",
        room: "103",
        rent: 11000,
        joiningDate: "2026-03-01",
        advance: 11000,
        due: 0,
        status: "Paid",
        occupation: "Analyst @ Deloitte",
        paymentDate: "2026-05-02",
        notes: "Paid via UPI"
    },
    {
        id: "T-004",
        name: "Aditi Rao",
        phone: "9123456789",
        aadhaar: "5678-9012-3456",
        room: "103",
        rent: 11000,
        joiningDate: "2026-03-05",
        advance: 11000,
        due: 11000,
        status: "Overdue",
        occupation: "UX Designer @ Microsoft",
        paymentDate: "",
        notes: "Requested split payment"
    },
    {
        id: "T-005",
        name: "Vikram Malhotra",
        phone: "9234567890",
        aadhaar: "9012-3456-7890",
        room: "201",
        rent: 16000,
        joiningDate: "2026-04-01",
        advance: 16000,
        due: 0,
        status: "Paid",
        occupation: "Manager @ Google",
        paymentDate: "2026-05-01",
        notes: "Corporate sponsor paid directly"
    }
];

const DEFAULT_COMPLAINTS = [
    {
        id: "C-001",
        room: "102",
        issue: "WiFi connection is extremely slow and drops during video calls.",
        severity: "medium",
        date: "2026-05-28",
        status: "pending"
    },
    {
        id: "C-002",
        room: "201",
        issue: "AC is leaking water inside the room from the filter panel.",
        severity: "high",
        date: "2026-05-29",
        status: "in-progress"
    },
    {
        id: "C-003",
        room: "103",
        issue: "Geyser auto-cut function is not working properly.",
        severity: "low",
        date: "2026-05-25",
        status: "resolved"
    }
];

const DEFAULT_ACTIVITIES = [
    { id: 1, text: "System initialized. Database is fresh.", time: "Just now", type: "info" }
];

let activities = [...DEFAULT_ACTIVITIES];

// Chart.js global instances
let revenueChart = null;
let occupancyChart = null;

// Pagination state for Tenants Table
let tenantPageState = {
    currentPage: 1,
    pageSize: 5
};

// State filters
let tenantFilters = {
    search: '',
    status: 'all',
    type: 'all'
};

let roomFilters = {
    floor: 'all',
    status: 'all'
};

// ----------------------------------------------------
// DATABASE LIFECYCLE
// ----------------------------------------------------
function getDbKey(suffix) {
    if (currentUser) {
        return `pgsmart_user_${currentUser.username.toLowerCase()}_${suffix}`;
    }
    return `pgsmart_guest_${suffix}`;
}

function initDatabase() {
    // Seed users list if not present
    if (!localStorage.getItem('pgsmart_users')) {
        const defaultUserList = [
            { fullname: "Sarah Connor", username: "admin", password: "admin123", role: "Super Admin" }
        ];
        localStorage.setItem('pgsmart_users', JSON.stringify(defaultUserList));
    }
    usersList = JSON.parse(localStorage.getItem('pgsmart_users'));

    // Check logged in user session (using sessionStorage to logout when app is closed)
    const savedSession = sessionStorage.getItem('pgsmart_current_user');
    if (savedSession) {
        currentUser = JSON.parse(savedSession);
    } else {
        currentUser = null;
    }

    // Determine database keys
    const roomsKey = getDbKey('rooms');
    const tenantsKey = getDbKey('tenants');
    const complaintsKey = getDbKey('complaints');
    const settingsKey = getDbKey('settings');

    // Seed individual partition if not present
    if (!localStorage.getItem(roomsKey)) {
        localStorage.setItem(roomsKey, JSON.stringify(currentUser ? [] : DEFAULT_ROOMS));
    }
    if (!localStorage.getItem(tenantsKey)) {
        localStorage.setItem(tenantsKey, JSON.stringify(currentUser ? [] : DEFAULT_TENANTS));
    }
    if (!localStorage.getItem(complaintsKey)) {
        localStorage.setItem(complaintsKey, JSON.stringify(currentUser ? [] : DEFAULT_COMPLAINTS));
    }
    if (!localStorage.getItem(settingsKey)) {
        localStorage.setItem(settingsKey, JSON.stringify(state.settings));
    }

    state.rooms = JSON.parse(localStorage.getItem(roomsKey));
    state.tenants = JSON.parse(localStorage.getItem(tenantsKey));
    state.complaints = JSON.parse(localStorage.getItem(complaintsKey));
    state.settings = JSON.parse(localStorage.getItem(settingsKey));

    // Apply saved configurations
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'dark');
    document.documentElement.setAttribute('data-accent', state.settings.accentColor || 'cyan');
    applySettings();
}

function saveData(key) {
    if (key === 'rooms' || key === 'all') {
        localStorage.setItem(getDbKey('rooms'), JSON.stringify(state.rooms));
    }
    if (key === 'tenants' || key === 'all') {
        localStorage.setItem(getDbKey('tenants'), JSON.stringify(state.tenants));
    }
    if (key === 'complaints' || key === 'all') {
        localStorage.setItem(getDbKey('complaints'), JSON.stringify(state.complaints));
    }
    if (key === 'settings' || key === 'all') {
        localStorage.setItem(getDbKey('settings'), JSON.stringify(state.settings));
    }
}


// Helper to track activity
function addActivity(text, type = 'info') {
    const time = "Just now";
    activities.unshift({
        id: Date.now(),
        text: text,
        time: time,
        type: type
    });
    if (activities.length > 8) activities.pop();
    renderActivities();
}

// ----------------------------------------------------
// AUTOMATIC MONTHLY RENT CYCLE CHECK
// ----------------------------------------------------
/**
 * Runs on every app load / login.
 *  • New month detected  → set every tenant's due = rent, status = "Pending"
 *  • Day > 10            → any still-"Pending" tenant becomes "Overdue"
 *  Uses a per-partition key (lastResetMonth) so each user's data resets
 *  independently and only once per calendar month.
 */
function checkMonthlyRentCycle() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // e.g. "2026-06"
    const day = now.getDate();

    const resetKey = getDbKey('lastResetMonth');
    const lastReset = localStorage.getItem(resetKey);

    let changed = false;

    // ---------- 1. New-month reset ----------
    if (lastReset !== currentMonth) {
        state.tenants.forEach(tenant => {
            tenant.due = tenant.rent;
            tenant.status = "Pending";
            tenant.paymentDate = "";
            tenant.notes = "";
        });
        localStorage.setItem(resetKey, currentMonth);
        changed = true;
        addActivity(`Monthly rent cycle reset for ${currentMonth}. All dues refreshed.`, 'refresh-cw');
    }

    // ---------- 2. Overdue escalation (after 10th) ----------
    if (day > 10) {
        state.tenants.forEach(tenant => {
            if (tenant.status === "Pending" && tenant.due > 0) {
                tenant.status = "Overdue";
                changed = true;
            }
        });
    }

    if (changed) {
        saveData('tenants');
    }
}

// ----------------------------------------------------
// CORE CALCULATIONS AND STATS
// ----------------------------------------------------
function calculateStats() {
    const totalRooms = state.rooms.length;
    
    // Calculate actual occupied beds by mapping tenants to rooms
    const occupiedBedsCount = state.tenants.length;
    const totalBedsCapacity = state.rooms.reduce((sum, r) => sum + r.capacity, 0);
    const vacantBedsCount = totalBedsCapacity - occupiedBedsCount;

    // Room Occupancy calculations
    // A room is "Occupied" if at least one tenant is inside, "Vacant" if zero tenants.
    // "Fully Occupied" if tenants inside = capacity.
    let occupiedRoomsCount = 0;
    let vacantRoomsCount = 0;

    state.rooms.forEach(room => {
        const count = state.tenants.filter(t => t.room === room.roomNumber).length;
        room.occupiedBeds = count;
        if (count > 0) {
            occupiedRoomsCount++;
        } else {
            vacantRoomsCount++;
        }
    });

    // Revenue calculations
    // Monthly Revenue represents the sum of rents of currently active tenants
    const monthlyRevenue = state.tenants.reduce((sum, t) => sum + t.rent, 0);

    // Pending Payments represents dues accummulated (status != 'Paid' / outstanding due sums)
    const pendingPayments = state.tenants.reduce((sum, t) => sum + (Number(t.due) || 0), 0);

    return {
        totalRooms,
        occupiedRooms: occupiedRoomsCount,
        vacantRooms: vacantRoomsCount,
        totalBeds: totalBedsCapacity,
        occupiedBeds: occupiedBedsCount,
        vacantBeds: vacantBedsCount,
        monthlyRevenue,
        pendingPayments
    };
}

// ----------------------------------------------------
// UI RENDERING - DASHBOARD
// ----------------------------------------------------
function renderDashboard() {
    const stats = calculateStats();

    // Stats updates with animation count effects (fallback if simple)
    animateValue("stat-total-rooms", stats.totalRooms);
    animateValue("stat-occupied-rooms", stats.occupiedRooms);
    animateValue("stat-vacant-rooms", stats.vacantRooms);
    animateValue("stat-monthly-revenue", stats.monthlyRevenue, true);
    animateValue("stat-pending-payments", stats.pendingPayments, true);

    // Progress updates
    const occupancyRate = stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0;
    document.getElementById("bed-occupancy-percent").innerText = `${occupancyRate}%`;
    document.getElementById("bed-progress-fill").style.strokeDashoffset = 220 - (220 * occupancyRate) / 100;
    document.getElementById("bed-ratio-info").innerText = `${stats.occupiedBeds} of ${stats.totalBeds} Beds Occupied`;

    // Render floor layout heatmap
    renderHeatmap();

    // Render activities log
    renderActivities();

    // Render Analytics Chart
    renderAnalyticsCharts(stats);
}

function animateValue(id, value, isCurrency = false) {
    const el = document.getElementById(id);
    if (!el) return;
    
    let start = 0;
    const end = parseInt(value);
    if (isNaN(end)) {
        el.innerText = value;
        return;
    }
    if (end === 0) {
        el.innerText = isCurrency ? "₹0" : "0";
        return;
    }

    const duration = 800; // ms
    const stepTime = Math.max(Math.floor(duration / Math.max(end, 1)), 15);
    const stepValue = Math.ceil(end / (duration / stepTime));

    const timer = setInterval(() => {
        start += stepValue;
        if (start >= end) {
            clearInterval(timer);
            start = end;
        }
        el.innerText = isCurrency ? `₹${start.toLocaleString('en-IN')}` : start;
    }, stepTime);
}

function renderHeatmap() {
    const container = document.getElementById("heatmap-grid");
    if (!container) return;
    container.innerHTML = "";

    // Group rooms by floors
    const floors = {};
    state.rooms.forEach(room => {
        if (!floors[room.floor]) floors[room.floor] = [];
        floors[room.floor].push(room);
    });

    // Sort floors descending (Floor 3 first)
    const sortedFloors = Object.keys(floors).sort((a, b) => b - a);

    sortedFloors.forEach(floor => {
        const floorRow = document.createElement("div");
        floorRow.className = "heatmap-floor-row";

        const label = document.createElement("div");
        label.className = "heatmap-floor-label";
        label.innerText = formatFloorName(floor);
        floorRow.appendChild(label);

        const grid = document.createElement("div");
        grid.className = "heatmap-cells";

        // Sort rooms inside floor ascending
        floors[floor].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));

        floors[floor].forEach(room => {
            const count = state.tenants.filter(t => t.room === room.roomNumber).length;
            let statusClass = "empty";
            if (count >= room.capacity) statusClass = "full";
            else if (count > 0) statusClass = "partial";

            const cell = document.createElement("div");
            cell.className = `heatmap-cell ${statusClass}`;
            cell.setAttribute("data-tooltip", `Room ${room.roomNumber}: ${count}/${room.capacity} Beds filled`);
            cell.innerHTML = `
                <span class="room-num">${room.roomNumber}</span>
                <span class="room-indicator"></span>
            `;
            cell.addEventListener("click", () => {
                showRoomDetailsModal(room);
            });
            grid.appendChild(cell);
        });

        floorRow.appendChild(grid);
        container.appendChild(floorRow);
    });
}

function renderActivities() {
    const list = document.getElementById("activity-timeline");
    if (!list) return;
    list.innerHTML = "";

    activities.forEach(act => {
        const li = document.createElement("div");
        li.className = "timeline-item";
        li.innerHTML = `
            <div class="timeline-icon">
                <i data-lucide="${act.type || 'info'}"></i>
            </div>
            <div class="timeline-content">
                <p class="timeline-text">${act.text}</p>
                <span class="timeline-time">${act.time}</span>
            </div>
        `;
        list.appendChild(li);
    });
    if (window.lucide) lucide.createIcons();
}

function renderAnalyticsCharts(stats) {
    if (!window.Chart) return;

    const ctxRevenue = document.getElementById("chart-revenue");
    const ctxOccupancy = document.getElementById("chart-occupancy");

    if (!ctxRevenue || !ctxOccupancy) return;

    // Destory existing charts to redraw on state changes
    if (revenueChart) revenueChart.destroy();
    if (occupancyChart) occupancyChart.destroy();

    // Custom glowing theme styles based on current accent
    const currentAccent = state.settings.accentColor || 'cyan';
    const accentHex = currentAccent === 'cyan' ? '#00f2fe' : 
                      currentAccent === 'purple' ? '#8a2be2' : 
                      currentAccent === 'green' ? '#00ff87' : '#f5af19';

    // Revenue Trend Chart (Area Chart)
    revenueChart = new Chart(ctxRevenue, {
        type: 'line',
        data: {
            labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May (Current)'],
            datasets: [{
                label: 'Monthly Collection (₹)',
                data: [35000, 48000, 52000, 68000, 81000, stats.monthlyRevenue - stats.pendingPayments],
                borderColor: accentHex,
                backgroundColor: 'rgba(0, 242, 254, 0.08)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: accentHex,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#8f9cae' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#8f9cae' }
                }
            }
        }
    });

    // Room occupancy breakdown (Doughnut)
    const singleSharing = state.rooms.filter(r => r.type === "Single").reduce((sum, r) => sum + r.occupiedBeds, 0);
    const doubleSharing = state.rooms.filter(r => r.type === "Double Sharing").reduce((sum, r) => sum + r.occupiedBeds, 0);
    const tripleSharing = state.rooms.filter(r => r.type === "Triple Sharing").reduce((sum, r) => sum + r.occupiedBeds, 0);

    occupancyChart = new Chart(ctxOccupancy, {
        type: 'doughnut',
        data: {
            labels: ['Single', 'Double', 'Triple'],
            datasets: [{
                data: [singleSharing, doubleSharing, tripleSharing],
                backgroundColor: [accentHex, '#9d4edd', '#e07a5f'],
                borderColor: 'rgba(15, 23, 42, 0.8)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#8f9cae', font: { family: 'Inter', size: 11 } }
                }
            },
            cutout: '70%'
        }
    });
}

// ----------------------------------------------------
// UI RENDERING - TENANTS (CRUD)
// ----------------------------------------------------
function renderTenants() {
    const listContainer = document.getElementById("tenant-table-rows");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    // Apply Search and filters
    let filtered = state.tenants.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(tenantFilters.search.toLowerCase()) ||
                              t.phone.includes(tenantFilters.search) ||
                              t.room.includes(tenantFilters.search) ||
                              (t.occupation && t.occupation.toLowerCase().includes(tenantFilters.search.toLowerCase()));
        
        const matchesStatus = tenantFilters.status === 'all' || t.status.toLowerCase() === tenantFilters.status.toLowerCase();
        
        // Match Room Type filter by loading matching room info
        let matchesType = true;
        if (tenantFilters.type !== 'all') {
            const roomObj = state.rooms.find(r => r.roomNumber === t.room);
            matchesType = roomObj && roomObj.type.toLowerCase() === tenantFilters.type.toLowerCase();
        }

        return matchesSearch && matchesStatus && matchesType;
    });

    // Pagination calculations
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / tenantPageState.pageSize) || 1;
    
    if (tenantPageState.currentPage > totalPages) {
        tenantPageState.currentPage = totalPages;
    }

    const startIndex = (tenantPageState.currentPage - 1) * tenantPageState.pageSize;
    const paginated = filtered.slice(startIndex, startIndex + tenantPageState.pageSize);

    // Update pagination HUD
    document.getElementById("tenant-page-indicator").innerText = `Page ${tenantPageState.currentPage} of ${totalPages}`;
    document.getElementById("btn-tenant-prev").disabled = tenantPageState.currentPage === 1;
    document.getElementById("btn-tenant-next").disabled = tenantPageState.currentPage === totalPages;

    if (paginated.length === 0) {
        listContainer.innerHTML = `<tr><td colspan="8" class="table-empty-row">No matching tenants found.</td></tr>`;
        return;
    }

    paginated.forEach(tenant => {
        const tr = document.createElement("tr");
        tr.className = "table-row-item";

        let badgeClass = "badge-paid";
        if (tenant.status === "Pending") badgeClass = "badge-pending";
        else if (tenant.status === "Overdue") badgeClass = "badge-overdue";

        tr.innerHTML = `
            <td>
                <div class="user-cell">
                    <span class="user-avatar">${tenant.name.split(" ").map(w => w[0]).join("")}</span>
                    <div class="user-meta">
                        <span class="user-name">${tenant.name}</span>
                        <span class="user-sub">${tenant.occupation || "N/A"}</span>
                    </div>
                </div>
            </td>
            <td>Room ${tenant.room}</td>
            <td>${tenant.phone}</td>
            <td>₹${tenant.rent.toLocaleString('en-IN')}</td>
            <td>₹${(tenant.due || 0).toLocaleString('en-IN')}</td>
            <td><span class="status-badge ${badgeClass}">${tenant.status}</span></td>
            <td>${formatDateString(tenant.joiningDate)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn btn-action-pay" title="Pay / Manage Dues" onclick="openPayModal('${tenant.id}')">
                        <i data-lucide="credit-card"></i>
                    </button>
                    <button class="table-btn btn-action-wa" title="Send Bill on WhatsApp" onclick="sendWhatsAppBill('${tenant.id}')">
                        <i data-lucide="message-square"></i>
                    </button>
                    <button class="table-btn btn-action-edit" title="Edit Tenant" onclick="openTenantModal('${tenant.id}')">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="table-btn btn-action-delete" title="Delete Tenant" onclick="deleteTenant('${tenant.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        listContainer.appendChild(tr);
    });

    if (window.lucide) lucide.createIcons();
}

function formatDateString(str) {
    if (!str) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(str).toLocaleDateString('en-US', options);
}

function formatFloorName(floorNum) {
    const num = Number(floorNum);
    if (num === 0) return "Ground Floor";
    if (num === 1) return "1st Floor";
    if (num === 2) return "2nd Floor";
    if (num === 3) return "3rd Floor";
    return `${num} Floor`;
}

// Open modal for Adding or Editing tenant
function openTenantModal(id = null) {
    const modal = document.getElementById("tenant-modal");
    const title = document.getElementById("tenant-modal-title");
    const form = document.getElementById("tenant-form");
    
    // Clear room list and populate
    const roomSelect = document.getElementById("form-tenant-room");
    roomSelect.innerHTML = '<option value="">Select Room</option>';
    
    // Only show rooms with available beds or the current room of the tenant
    const currentTenant = id ? state.tenants.find(t => t.id === id) : null;

    state.rooms.forEach(room => {
        const occupants = state.tenants.filter(t => t.room === room.roomNumber).length;
        const hasSpace = occupants < room.capacity;
        const isCurrentRoom = currentTenant && currentTenant.room === room.roomNumber;
        
        if (hasSpace || isCurrentRoom) {
            const option = document.createElement("option");
            option.value = room.roomNumber;
            option.innerText = `Room ${room.roomNumber} (${room.type} - Available: ${room.capacity - occupants + (isCurrentRoom ? 1 : 0)})`;
            roomSelect.appendChild(option);
        }
    });

    if (id) {
        title.innerText = "Edit Tenant Details";
        const tenant = state.tenants.find(t => t.id === id);
        
        document.getElementById("form-tenant-id").value = tenant.id;
        document.getElementById("form-tenant-name").value = tenant.name;
        document.getElementById("form-tenant-phone").value = tenant.phone;
        document.getElementById("form-tenant-aadhaar").value = tenant.aadhaar;
        document.getElementById("form-tenant-room").value = tenant.room;
        document.getElementById("form-tenant-rent").value = tenant.rent;
        document.getElementById("form-tenant-joining").value = tenant.joiningDate;
        document.getElementById("form-tenant-advance").value = tenant.advance;
        document.getElementById("form-tenant-due").value = tenant.due;
        document.getElementById("form-tenant-emergency").value = tenant.emergencyContact;
        document.getElementById("form-tenant-occupation").value = tenant.occupation;
    } else {
        title.innerText = "Register New Tenant";
        form.reset();
        document.getElementById("form-tenant-id").value = "";
        document.getElementById("form-tenant-joining").value = new Date().toISOString().split("T")[0];
    }
    
    modal.classList.add("active");
}

function closeTenantModal() {
    document.getElementById("tenant-modal").classList.remove("active");
}

function handleTenantSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("form-tenant-id").value;
    const name = document.getElementById("form-tenant-name").value.trim();
    const phone = document.getElementById("form-tenant-phone").value.trim();
    const aadhaar = document.getElementById("form-tenant-aadhaar").value.trim();
    const room = document.getElementById("form-tenant-room").value;
    const rent = Number(document.getElementById("form-tenant-rent").value);
    const joiningDate = document.getElementById("form-tenant-joining").value;
    const advance = Number(document.getElementById("form-tenant-advance").value);
    const due = Number(document.getElementById("form-tenant-due").value);
    const emergencyContact = document.getElementById("form-tenant-emergency").value.trim();
    const occupation = document.getElementById("form-tenant-occupation").value.trim();

    if (!name || !phone || !room || !rent) {
        showToast("Please fill all required fields.", "error");
        return;
    }

    if (id) {
        // Edit flow
        const idx = state.tenants.findIndex(t => t.id === id);
        if (idx !== -1) {
            state.tenants[idx] = {
                ...state.tenants[idx],
                name, phone, aadhaar, room, rent, joiningDate, advance, due, emergencyContact, occupation,
                status: due > 0 ? "Pending" : "Paid"
            };
            addActivity(`Updated tenant profile: ${name}`, 'edit-3');
            showToast("Tenant updated successfully.", "success");
        }
    } else {
        // Add flow
        const newId = `T-${String(Date.now()).slice(-3)}`;
        const newTenant = {
            id: newId,
            name, phone, aadhaar, room, rent, joiningDate, advance, due, emergencyContact, occupation,
            status: due > 0 ? "Pending" : "Paid",
            paymentDate: "",
            notes: ""
        };
        state.tenants.push(newTenant);
        addActivity(`Registered new tenant: ${name} (Room ${room})`, 'user-plus');
        showToast("Tenant added successfully.", "success");
    }

    saveData('tenants');
    closeTenantModal();
    renderTenants();
    renderDashboard();
}

function deleteTenant(id) {
    const tenant = state.tenants.find(t => t.id === id);
    if (!tenant) return;
    
    if (confirm(`Are you sure you want to checkout/remove ${tenant.name}?`)) {
        state.tenants = state.tenants.filter(t => t.id !== id);
        addActivity(`Removed tenant: ${tenant.name} from Room ${tenant.room}`, 'trash-2');
        saveData('tenants');
        renderTenants();
        renderDashboard();
        showToast("Tenant removed successfully.", "info");
    }
}

// Voice Search using Web Speech API
function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast("Voice search is not supported by your browser.", "error");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const micBtn = document.getElementById("btn-voice-search");
    micBtn.classList.add("listening");
    showToast("Listening for tenant name...", "info");

    recognition.start();

    recognition.onresult = function(event) {
        const speechResult = event.results[0][0].transcript.toLowerCase().trim();
        document.getElementById("tenant-search-input").value = speechResult;
        tenantFilters.search = speechResult;
        renderTenants();
        showToast(`Searching for: "${speechResult}"`, "success");
    };

    recognition.onspeechend = function() {
        recognition.stop();
        micBtn.classList.remove("listening");
    };

    recognition.onerror = function(event) {
        micBtn.classList.remove("listening");
        showToast(`Voice Search Error: ${event.error}`, "error");
    };
}

// ----------------------------------------------------
// UI RENDERING - ROOMS
// ----------------------------------------------------
function renderRooms() {
    const grid = document.getElementById("rooms-grid-container");
    if (!grid) return;
    grid.innerHTML = "";

    let filtered = state.rooms.filter(room => {
        const matchesFloor = roomFilters.floor === 'all' || Number(room.floor) === Number(roomFilters.floor);
        
        let matchesStatus = true;
        const occupantsCount = state.tenants.filter(t => t.room === room.roomNumber).length;
        if (roomFilters.status === 'vacant') {
            matchesStatus = occupantsCount === 0;
        } else if (roomFilters.status === 'occupied') {
            matchesStatus = occupantsCount > 0;
        }

        return matchesFloor && matchesStatus;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="grid-empty-state">No rooms match the selected filters.</div>`;
        return;
    }

    filtered.forEach(room => {
        const occupants = state.tenants.filter(t => t.room === room.roomNumber);
        const count = occupants.length;
        const available = room.capacity - count;
        
        let statusText = "Vacant";
        let statusClass = "room-vacant";
        
        if (count >= room.capacity) {
            statusText = "Fully Occupied";
            statusClass = "room-full";
        } else if (count > 0) {
            statusText = `${count}/${room.capacity} Occupied`;
            statusClass = "room-partial";
        }

        const card = document.createElement("div");
        card.className = `room-card ${statusClass}`;
        
        // Build avatars list
        let avatarsHTML = "";
        occupants.forEach(occ => {
            avatarsHTML += `<span class="room-guest-avatar" title="${occ.name}">${occ.name.split(" ").map(w => w[0]).join("")}</span>`;
        });
        for (let i = 0; i < available; i++) {
            avatarsHTML += `<span class="room-guest-avatar vacant-slot" title="Available Bed">+</span>`;
        }

        card.innerHTML = `
            <div class="room-card-header">
                <span class="room-card-number">Room ${room.roomNumber}</span>
                <span class="room-card-status-badge">${statusText}</span>
            </div>
            <div class="room-card-body">
                <div class="room-spec-row">
                    <span class="room-spec"><i data-lucide="tag"></i> ${room.type}</span>
                    <span class="room-spec"><i data-lucide="wind"></i> ${room.ac ? "AC" : "Non-AC"}</span>
                </div>
                <div class="room-spec-row">
                    <span class="room-spec"><i data-lucide="layers"></i> ${formatFloorName(room.floor)}</span>
                    <span class="room-spec rent-highlight">₹${room.rent.toLocaleString('en-IN')}/mo</span>
                </div>
                <div class="room-occupancy-tracker">
                    <span class="occupancy-label">Beds Distribution:</span>
                    <div class="occupancy-avatars-list">
                        ${avatarsHTML}
                    </div>
                </div>
            </div>
            <div class="room-card-footer">
                <button class="room-action-btn copy-btn" onclick="copyRoomConfig('${room.roomNumber}')"><i data-lucide="copy"></i> Copy</button>
                <button class="room-action-btn edit-btn" onclick="openRoomEditModal('${room.roomNumber}')"><i data-lucide="edit-2"></i> Manage</button>
                <button class="room-action-btn delete-btn" onclick="deleteRoom('${room.roomNumber}')"><i data-lucide="trash-2"></i> Remove</button>
            </div>
        `;
        grid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

function openRoomModal(roomNum = null) {
    const modal = document.getElementById("room-modal");
    const title = document.getElementById("room-modal-title");
    const form = document.getElementById("room-form");

    if (roomNum) {
        title.innerText = "Edit Room Config";
        const room = state.rooms.find(r => r.roomNumber === roomNum);
        document.getElementById("form-room-number").value = room.roomNumber;
        document.getElementById("form-room-number").disabled = true; // cannot change room ID
        document.getElementById("form-room-type").value = room.type;
        document.getElementById("form-room-ac").checked = room.ac;
        document.getElementById("form-room-rent").value = room.rent;
        document.getElementById("form-room-floor").value = room.floor;
    } else {
        title.innerText = "Create New Room";
        form.reset();
        document.getElementById("form-room-number").disabled = false;
    }

    modal.classList.add("active");
}

function closeRoomModal() {
    document.getElementById("room-modal").classList.remove("active");
}

function handleRoomSubmit(e) {
    e.preventDefault();
    const number = document.getElementById("form-room-number").value.trim();
    const type = document.getElementById("form-room-type").value;
    const ac = document.getElementById("form-room-ac").checked;
    const rent = Number(document.getElementById("form-room-rent").value);
    const floorStr = document.getElementById("form-room-floor").value;

    if (!number || !type || !rent || floorStr === "") {
        showToast("Please fill all required fields.", "error");
        return;
    }
    const floor = Number(floorStr);

    // Determine capacity from type
    let capacity = 1;
    if (type === "Double Sharing") capacity = 2;
    else if (type === "Triple Sharing") capacity = 3;

    // Check if room number is disabled (indicates editing)
    const isEdit = document.getElementById("form-room-number").disabled;

    if (isEdit) {
        const idx = state.rooms.findIndex(r => r.roomNumber === number);
        if (idx !== -1) {
            state.rooms[idx] = { ...state.rooms[idx], type, ac, rent, floor, capacity };
            addActivity(`Updated Room Configuration: Room ${number}`, 'edit-2');
            showToast("Room updated successfully.", "success");
        }
    } else {
        // Check duplication
        if (state.rooms.some(r => r.roomNumber === number)) {
            showToast("Room number already exists.", "error");
            return;
        }
        state.rooms.push({ roomNumber: number, type, ac, rent, floor, capacity, occupiedBeds: 0 });
        addActivity(`Added new room to layout: Room ${number}`, 'plus-circle');
        showToast("Room created successfully.", "success");
    }

    saveData('rooms');
    closeRoomModal();
    renderRooms();
    renderDashboard();
}

function openRoomEditModal(roomNum) {
    openRoomModal(roomNum);
}

function copyRoomConfig(roomNum) {
    const room = state.rooms.find(r => r.roomNumber === roomNum);
    if (!room) return;

    openRoomModal(); // opens in create mode
    
    // Auto-fill configuration values
    document.getElementById("form-room-number").value = "";
    document.getElementById("form-room-number").focus();
    
    document.getElementById("form-room-type").value = room.type;
    document.getElementById("form-room-ac").checked = room.ac;
    document.getElementById("form-room-rent").value = room.rent;
    document.getElementById("form-room-floor").value = room.floor;
    
    showToast(`Copied configuration of Room ${roomNum}. Enter new number & floor to save.`, "info");
}

function deleteRoom(roomNum) {
    // Check if room has active tenants
    const count = state.tenants.filter(t => t.room === roomNum).length;
    if (count > 0) {
        showToast(`Cannot delete Room ${roomNum}. Clear or move active tenants first.`, "error");
        return;
    }

    if (confirm(`Remove Room ${roomNum} from the properties?`)) {
        state.rooms = state.rooms.filter(r => r.roomNumber !== roomNum);
        addActivity(`Removed Room ${roomNum} from dashboard`, 'trash-2');
        saveData('rooms');
        renderRooms();
        renderDashboard();
        showToast("Room deleted.", "info");
    }
}

function showRoomDetailsModal(room) {
    const modal = document.getElementById("room-details-modal");
    if (!modal) return;

    const header = document.getElementById("rd-modal-header");
    const occupantsList = document.getElementById("rd-occupants-list");

    header.innerText = `Room ${room.roomNumber} - Guest Profile`;
    occupantsList.innerHTML = "";

    const occupants = state.tenants.filter(t => t.room === room.roomNumber);

    if (occupants.length === 0) {
        occupantsList.innerHTML = `<div class="rd-empty">No active occupants in this room. Configured for ${room.type} (${room.ac ? "AC" : "Non-AC"}).</div>`;
    } else {
        occupants.forEach(occ => {
            const card = document.createElement("div");
            card.className = "rd-occupant-card";
            card.innerHTML = `
                <div class="rd-occ-header">
                    <span class="rd-occ-name">${occ.name}</span>
                    <span class="status-badge ${occ.status === 'Paid' ? 'badge-paid' : 'badge-pending'}">${occ.status}</span>
                </div>
                <div class="rd-occ-details">
                    <p><strong>Phone:</strong> ${occ.phone}</p>
                    <p><strong>Aadhaar:</strong> ${occ.aadhaar}</p>
                    <p><strong>Due Rent:</strong> ₹${occ.due}</p>
                    <p><strong>Joining:</strong> ${formatDateString(occ.joiningDate)}</p>
                    <p><strong>Company/Job:</strong> ${occ.occupation || 'N/A'}</p>
                </div>
            `;
            occupantsList.appendChild(card);
        });
    }

    modal.classList.add("active");
}

function closeRoomDetailsModal() {
    document.getElementById("room-details-modal").classList.remove("active");
}

// ----------------------------------------------------
// UI RENDERING - PAYMENTS & RENT MANAGER
// ----------------------------------------------------
function openPayModal(tenantId) {
    const tenant = state.tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    document.getElementById("pay-tenant-id").value = tenant.id;
    document.getElementById("pay-tenant-name").innerText = tenant.name;
    document.getElementById("pay-room-number").innerText = `Room ${tenant.room}`;
    document.getElementById("pay-monthly-rent").innerText = `₹${tenant.rent.toLocaleString('en-IN')}`;
    
    const dueField = document.getElementById("pay-due-amount");
    dueField.value = tenant.due;

    const notesField = document.getElementById("pay-notes");
    notesField.value = tenant.notes || "";

    const statusField = document.getElementById("pay-status");
    statusField.value = tenant.status;

    // Generate UPI QR Code inside modal
    generatePayQR(tenant.due, tenant.name, tenant.room);

    // Watch due amount change to update QR Code
    dueField.oninput = function() {
        generatePayQR(this.value, tenant.name, tenant.room);
    };

    document.getElementById("pay-modal").classList.add("active");
}

function closePayModal() {
    document.getElementById("pay-modal").classList.remove("active");
}

function generatePayQR(amount, name, room) {
    const qrContainer = document.getElementById("pay-qrcode-box");
    if (!qrContainer) return;

    if (!amount || Number(amount) <= 0) {
        qrContainer.innerHTML = `<div class="qr-no-due">No pending dues.<br>QR code not required.</div>`;
        return;
    }

    // Construct standard UPI Pay URL scheme
    // e.g. upi://pay?pa=pgsmart@upi&pn=PGSmart&am=12000&cu=INR&tn=Rent%20for%20Room%20102
    const upiId = state.settings.upiId || "pgsmart@upi";
    const note = `Rent payment Room ${room}`;
    const upiUrl = `upi://pay?pa=${upiId}&pn=PGSmart%20Rental&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    const hasCustomScanner = !!state.settings.upiScannerQr;

    if (!hasCustomScanner) {
        qrContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <img class="qr-code-img" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}" alt="UPI QR Code">
                <span class="qr-tag">Scan with any UPI App</span>
                <span style="font-size: 0.65rem; color: var(--text-muted); text-align: center; margin-top: 8px; max-width: 180px;">Tip: Upload your personal scanner screenshot in Settings!</span>
            </div>
        `;
    } else {
        qrContainer.innerHTML = `
            <div class="qr-tabs" style="display: flex; gap: 5px; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; justify-content: center; width: 100%;">
                <button type="button" id="tab-dynamic-qr" class="btn-pag active" style="padding: 2px 10px; font-size: 0.75rem;" onclick="toggleQrTab('dynamic')">Dynamic QR</button>
                <button type="button" id="tab-custom-scanner" class="btn-pag" style="padding: 2px 10px; font-size: 0.75rem;" onclick="toggleQrTab('custom')">Static Scanner</button>
            </div>
            <div id="qr-content-dynamic" class="qr-tab-content active" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <img class="qr-code-img" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}" alt="UPI QR Code">
                <span class="qr-tag">Scan to Pay: ₹${Number(amount).toLocaleString('en-IN')}</span>
            </div>
            <div id="qr-content-custom" class="qr-tab-content" style="display: none; flex-direction: column; align-items: center; justify-content: center;">
                <img class="qr-code-img" src="${state.settings.upiScannerQr}" alt="Custom UPI Scanner" style="object-fit: contain; width: 160px; height: 160px; border-radius: 8px;">
                <span class="qr-tag">Static QR Code (${upiId})</span>
            </div>
        `;
    }
}

function toggleQrTab(tabType) {
    const tabDynamic = document.getElementById("tab-dynamic-qr");
    const tabCustom = document.getElementById("tab-custom-scanner");
    const contentDynamic = document.getElementById("qr-content-dynamic");
    const contentCustom = document.getElementById("qr-content-custom");

    if (tabType === 'dynamic') {
        if (tabDynamic) tabDynamic.classList.add("active");
        if (tabCustom) tabCustom.classList.remove("active");
        if (contentDynamic) contentDynamic.style.display = "flex";
        if (contentCustom) contentCustom.style.display = "none";
    } else {
        if (tabDynamic) tabDynamic.classList.remove("active");
        if (tabCustom) tabCustom.classList.add("active");
        if (contentDynamic) contentDynamic.style.display = "none";
        if (contentCustom) contentCustom.style.display = "flex";
    }
}

function handlePaySubmit(e) {
    e.preventDefault();
    const id = document.getElementById("pay-tenant-id").value;
    const due = Number(document.getElementById("pay-due-amount").value);
    const status = document.getElementById("pay-status").value;
    const notes = document.getElementById("pay-notes").value.trim();

    const tenantIdx = state.tenants.findIndex(t => t.id === id);
    if (tenantIdx === -1) return;

    const tenant = state.tenants[tenantIdx];

    // Determine if fully paid
    let oldStatus = tenant.status;
    let newStatus = status;
    if (due === 0) {
        newStatus = "Paid";
    }

    state.tenants[tenantIdx] = {
        ...tenant,
        due: due,
        status: newStatus,
        notes: notes,
        paymentDate: newStatus === "Paid" ? new Date().toISOString().split("T")[0] : tenant.paymentDate
    };

    saveData('tenants');
    addActivity(`Recorded payment updates for ${tenant.name} (Due: ₹${due})`, 'credit-card');
    showToast(`Payment updated for ${tenant.name}`, "success");
    
    closePayModal();
    renderTenants();
    renderDashboard();
    
    // Automatically trigger receipt print option if marked paid
    if (newStatus === "Paid" && oldStatus !== "Paid") {
        if (confirm("Would you like to print/download the Rent Receipt for this payment?")) {
            triggerReceiptPrint(state.tenants[tenantIdx]);
        }
    }
}

// Generate rent receipt print overlay
function triggerReceiptPrint(tenant) {
    // Create hidden/printable div
    const receiptId = `REC-${Date.now().toString().slice(-6)}`;
    const printWindow = window.open('', '_blank');
    
    const styles = `
        body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
        .receipt-container { border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; }
        .receipt-header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; }
        .brand-name { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
        .receipt-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; text-align: right; margin: 0; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .detail-item h4 { margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .detail-item p { margin: 0; font-size: 15px; font-weight: 600; color: #0f172a; }
        .amount-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .amount-table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left; padding: 10px; color: #475569; font-size: 13px; }
        .amount-table td { border-bottom: 1px solid #e2e8f0; padding: 12px 10px; font-size: 14px; }
        .amount-total { font-size: 18px; font-weight: 800; color: #0f172a; }
        .footer-note { text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; color: #64748b; font-size: 12px; }
    `;

    printWindow.document.write(`
        <html>
            <head>
                <title>Rent Receipt - ${tenant.name}</title>
                <style>${styles}</style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="receipt-header">
                        <div>
                            <h2 class="brand-name">${state.settings.pgName || 'PGSmart Rental Application'}</h2>
                            <p style="margin:5px 0 0 0; font-size:12px; color:#64748b;">${state.settings.tagline || 'Smart Living. Smart Management.'}</p>
                        </div>
                        <div>
                            <h3 class="receipt-title">RENT RECEIPT</h3>
                            <p style="margin:5px 0 0 0; font-size:12px; text-align:right;"># ${receiptId}</p>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-item">
                            <h4>Received From</h4>
                            <p>${tenant.name}</p>
                        </div>
                        <div class="detail-item">
                            <h4>Room Allotted</h4>
                            <p>Room ${tenant.room}</p>
                        </div>
                        <div class="detail-item">
                            <h4>Payment Date</h4>
                            <p>${formatDateString(tenant.paymentDate || new Date().toISOString().split("T")[0])}</p>
                        </div>
                        <div class="detail-item">
                            <h4>Received By</h4>
                            <p>${currentUser ? currentUser.fullname : 'Property Manager'}</p>
                        </div>
                        <div class="detail-item">
                            <h4>Transaction Mode</h4>
                            <p>UPI / Digital Transfer</p>
                        </div>
                    </div>
                    
                    <table class="amount-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: right;">Amount Paid</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Monthly Rental Charges (Room ${tenant.room})</td>
                                <td style="text-align: right;">₹${tenant.rent.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td>Security Deposit / Advance (Adjusted)</td>
                                <td style="text-align: right;">₹0</td>
                            </tr>
                            <tr style="background: #f8fafc;">
                                <td style="font-weight: 700;">Total Paid Amount</td>
                                <td style="text-align: right;" class="amount-total">₹${tenant.rent.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="footer-note">
                        <p>Thank you for choosing ${state.settings.pgName || 'PGSmart Rental Application'}. This is an electronically generated statement.</p>
                        <p style="margin: 5px 0 0 0; font-weight: 500;">Support Desk: support@pgsmart.app</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        }
                    }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// ----------------------------------------------------
// WHATSAPP BILL INTEGRATION
// ----------------------------------------------------
function sendWhatsAppBill(tenantId) {
    const tenant = state.tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const name = tenant.name;
    const room = tenant.room;
    const rent = tenant.rent;
    const due = tenant.due;
    const phone = tenant.phone;

    const pgName = state.settings.pgName || "PGSmart Rental";
    let message = "";
    if (due > 0) {
        message = `Hello ${name}, your monthly rent for Room ${room} at *${pgName}* is ₹${rent.toLocaleString('en-IN')}. You have outstanding pending dues of *₹${due.toLocaleString('en-IN')}*. Please clear it before the due date. Thank you.`;
    } else {
        message = `Hello ${name}, your monthly rent invoice for Room ${room} at *${pgName}* is ₹${rent.toLocaleString('en-IN')}. Status: *PAID*. Thank you for paying on time!`;
    }

    // Format phone: if no international prefix, append default 91
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.length === 10) {
        formattedPhone = "91" + formattedPhone;
    }

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    addActivity(`WhatsApp bill sent to ${name} (${phone})`, 'message-square');
    showToast(`Drafted WhatsApp notification for ${name}`, "info");
}

// ----------------------------------------------------
// EXPORT TENANTS TO PDF
// ----------------------------------------------------
function exportTenantsToPDF() {
    if (!window.html2pdf) {
        showToast("PDF generation engine loading. Try printing directly.", "warning");
        window.print();
        return;
    }

    // Create a temporary clone div of the tenants list styled nicely for PDF
    const printArea = document.createElement("div");
    printArea.style.padding = "30px";
    printArea.style.color = "#1e293b";
    printArea.style.background = "#ffffff";
    printArea.style.fontFamily = "Inter, sans-serif";

    let rowsHTML = "";
    state.tenants.forEach(t => {
        rowsHTML += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:600;">${t.name}</td>
                <td style="padding:10px;">Room ${t.room}</td>
                <td style="padding:10px;">${t.phone}</td>
                <td style="padding:10px;">₹${t.rent.toLocaleString('en-IN')}</td>
                <td style="padding:10px;">₹${(t.due || 0).toLocaleString('en-IN')}</td>
                <td style="padding:10px; font-weight:600; color:${t.status === 'Paid' ? '#10b981' : '#f59e0b'}">${t.status}</td>
                <td style="padding:10px;">${t.joiningDate}</td>
            </tr>
        `;
    });

    printArea.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:30px; border-bottom:3px solid #0f172a; padding-bottom:15px;">
            <div>
                <h1 style="margin:0; font-size:26px; color:#0f172a;">${state.settings.pgName || 'PGSmart Rental Application'}</h1>
                <p style="margin:5px 0 0 0; color:#64748b;">PG Rental Management - Tenant Directory</p>
            </div>
            <div style="text-align:right;">
                <p style="margin:0; font-weight:600;">Date Generated</p>
                <p style="margin:5px 0 0 0; color:#64748b;">${new Date().toLocaleDateString()}</p>
            </div>
        </div>

        <table style="width:100%; border-collapse:collapse; text-align:left;">
            <thead>
                <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1;">
                    <th style="padding:12px 10px;">Tenant Name</th>
                    <th style="padding:12px 10px;">Room</th>
                    <th style="padding:12px 10px;">Phone</th>
                    <th style="padding:12px 10px;">Rent</th>
                    <th style="padding:12px 10px;">Dues</th>
                    <th style="padding:12px 10px;">Status</th>
                    <th style="padding:12px 10px;">Joining Date</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>
    `;

    const opt = {
        margin:       10,
        filename:     `${(state.settings.pgName || 'PGSmart').replace(/[^a-zA-Z0-9]/g, '_')}_Tenants_Database.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().from(printArea).set(opt).save().then(() => {
        showToast("PDF Export Complete.", "success");
    });
}

// ----------------------------------------------------
// UI RENDERING - COMPLAINTS / EMERGENCY SUPPORT
// ----------------------------------------------------
function renderComplaints() {
    const list = document.getElementById("complaints-list");
    if (!list) return;
    list.innerHTML = "";

    if (state.complaints.length === 0) {
        list.innerHTML = `<div class="complaints-empty">All issues cleared! No complaints logged.</div>`;
        return;
    }

    state.complaints.forEach(comp => {
        const item = document.createElement("div");
        item.className = `complaint-card comp-status-${comp.status}`;
        item.innerHTML = `
            <div class="comp-header">
                <span class="comp-room">Room ${comp.room}</span>
                <span class="comp-badge comp-sev-${comp.severity}">${comp.severity.toUpperCase()}</span>
            </div>
            <p class="comp-desc">${comp.issue}</p>
            <div class="comp-footer">
                <span class="comp-date"><i data-lucide="calendar"></i> ${formatDateString(comp.date)}</span>
                <div class="comp-actions">
                    <select class="comp-status-select" onchange="updateComplaintStatus('${comp.id}', this.value)">
                        <option value="pending" ${comp.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${comp.status === 'in-progress' ? 'selected' : ''}>Fixing</option>
                        <option value="resolved" ${comp.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                    <button class="comp-delete-btn" onclick="deleteComplaint('${comp.id}')"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
        list.appendChild(item);
    });

    if (window.lucide) lucide.createIcons();
}

function handleComplaintSubmit(e) {
    e.preventDefault();
    const room = document.getElementById("comp-form-room").value.trim();
    const issue = document.getElementById("comp-form-issue").value.trim();
    const severity = document.getElementById("comp-form-severity").value;

    if (!room || !issue) {
        showToast("Fill in the room number and description.", "error");
        return;
    }

    const newComp = {
        id: `C-${Date.now().toString().slice(-3)}`,
        room,
        issue,
        severity,
        date: new Date().toISOString().split("T")[0],
        status: "pending"
    };

    state.complaints.unshift(newComp);
    saveData('complaints');
    addActivity(`Registered complaint for Room ${room}`, 'alert-triangle');
    showToast("Complaint logged successfully.", "success");

    e.target.reset();
    renderComplaints();
    renderDashboard();
}

function updateComplaintStatus(id, newStatus) {
    const idx = state.complaints.findIndex(c => c.id === id);
    if (idx === -1) return;
    
    state.complaints[idx].status = newStatus;
    saveData('complaints');
    addActivity(`Complaint ${id} status updated to: ${newStatus}`, 'check-circle');
    showToast("Complaint updated.", "success");
    renderComplaints();
}

function deleteComplaint(id) {
    if (confirm("Remove complaint record?")) {
        state.complaints = state.complaints.filter(c => c.id !== id);
        saveData('complaints');
        showToast("Complaint record deleted.", "info");
        renderComplaints();
    }
}

// ----------------------------------------------------
// INTERACTIVE AI CHATBOT
// ----------------------------------------------------
const CHATBOT_RESPONSES = {
    help: "Available keywords: **rooms**, **dues**, **wifi**, **food**, **contact**, **rent**.",
    rooms: function() {
        const stats = calculateStats();
        return `We currently have **${stats.vacantRooms} Vacant Rooms** and **${stats.vacantBeds} Available Beds** out of a total capacity of ${stats.totalBeds}.`;
    },
    dues: function() {
        const unpaid = state.tenants.filter(t => t.due > 0);
        if (unpaid.length === 0) return "Hurrah! All tenants have fully paid their dues.";
        
        let msg = `We have ${unpaid.length} tenants with outstanding dues:\n`;
        unpaid.forEach(u => {
            msg += `• **${u.name}** (Room ${u.room}): ₹${u.due.toLocaleString('en-IN')}\n`;
        });
        return msg;
    },
    wifi: "The high-speed fiber WiFi SSID is **PGSmart_5G** and the passcode is `PGSmart_Guest_5G`.",
    food: "Meals are served in the dining hall:\n• **Breakfast:** 7:30 AM - 9:30 AM\n• **Lunch:** 12:30 PM - 2:30 PM\n• **Dinner:** 7:30 PM - 9:30 PM",
    contact: "You can reach the facility manager at **+91 99999 88888** or visit the reception counter from 9 AM to 8 PM.",
    rent: "Rent is calculated on the 1st of every month and must be paid by the 5th to avoid late fees of ₹100/day. Payments can be initialized by clicking the 'Pay' icon in the tenant dashboard list."
};

function toggleChatbot() {
    const chatDrawer = document.getElementById("chatbot-drawer");
    chatDrawer.classList.toggle("active");
    
    // Inject welcoming message if empty
    const body = document.getElementById("chatbot-body");
    if (body.children.length === 0) {
        appendChatMessage("AI Assistant", "Welcome to PGSmart AI Assistant. How can I help you manage the property today? Ask me about **rooms**, **dues**, **wifi**, **food**, or type **help**.", "bot");
    }
}

function appendChatMessage(sender, text, type) {
    const body = document.getElementById("chatbot-body");
    if (!body) return;

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble bubble-${type}`;
    bubble.innerHTML = `
        <div class="chat-sender">${sender}</div>
        <div class="chat-text">${text.replace(/\n/g, '<br>')}</div>
    `;
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
}

function sendChatbotMessage() {
    const input = document.getElementById("chatbot-input-field");
    const query = input.value.trim().toLowerCase();
    if (!query) return;

    appendChatMessage("You", input.value, "user");
    input.value = "";

    setTimeout(() => {
        let answer = "I'm sorry, I didn't quite catch that. Type **help** to see valid commands or ask about **rooms** or **dues**.";
        
        for (let keyword in CHATBOT_RESPONSES) {
            if (query.includes(keyword)) {
                const response = CHATBOT_RESPONSES[keyword];
                answer = typeof response === 'function' ? response() : response;
                break;
            }
        }
        appendChatMessage("AI Assistant", answer, "bot");
    }, 450);
}

// ----------------------------------------------------
// THEME & ACCENT MANAGEMENT
// ----------------------------------------------------
function toggleThemeMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    state.settings.theme = newTheme;
    saveData('settings');

    const themeIcon = document.getElementById("theme-toggle-icon");
    if (themeIcon) {
        themeIcon.setAttribute("data-lucide", newTheme === 'light' ? "moon" : "sun");
        if (window.lucide) lucide.createIcons();
    }
    
    showToast(`Theme switched to ${newTheme.toUpperCase()}`, "info");
    
    // Refresh charts to match colors
    const stats = calculateStats();
    renderAnalyticsCharts(stats);
}

function changeAccentColor(colorName) {
    document.documentElement.setAttribute('data-accent', colorName);
    state.settings.accentColor = colorName;
    saveData('settings');
    
    showToast(`Accent color updated to ${colorName.toUpperCase()}`, "success");

    // Redraw charts with new accent colors
    const stats = calculateStats();
    renderAnalyticsCharts(stats);
}

// ----------------------------------------------------
// ROUTING & VIEW CONTROLLER
// ----------------------------------------------------
function switchView(viewId) {
    const sections = document.querySelectorAll(".content-section");
    sections.forEach(sec => {
        sec.classList.remove("active");
    });

    const activeSec = document.getElementById(`view-${viewId}`);
    if (activeSec) {
        activeSec.classList.add("active");
    }

    // Sidebar active item updates
    const navLinks = document.querySelectorAll(".sidebar-nav li");
    navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("data-view") === viewId) {
            link.classList.add("active");
        }
    });

    // Mobile Hamburger auto-close
    const sidebar = document.getElementById("app-sidebar");
    if (sidebar.classList.contains("mobile-active")) {
        sidebar.classList.remove("mobile-active");
    }

    // Refresh layout data
    if (viewId === 'dashboard') renderDashboard();
    else if (viewId === 'tenants') renderTenants();
    else if (viewId === 'rooms') renderRooms();
    else if (viewId === 'complaints') renderComplaints();

    // Update main header page title
    const headerTitle = document.getElementById("main-header-title");
    if (headerTitle) {
        headerTitle.innerText = viewId.charAt(0).toUpperCase() + viewId.slice(1);
    }
}

// ----------------------------------------------------
// TOAST NOTIFICATIONS
// ----------------------------------------------------
function showToast(message, type = 'success') {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconName = "check-circle";
    if (type === 'error') iconName = "x-circle";
    else if (type === 'warning') iconName = "alert-triangle";
    else if (type === 'info') iconName = "info";

    toast.innerHTML = `
        <i class="toast-icon" data-lucide="${iconName}"></i>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    // Slide in
    setTimeout(() => {
        toast.classList.add("active");
    }, 50);

    // Fade out and remove
    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ----------------------------------------------------
// SYSTEM SETTINGS DIALOG
// ----------------------------------------------------
let tempScannerBase64 = null;

function applySettings() {
    // Apply PG Name and Tagline to sidebar logo and document title
    const brandNameEl = document.getElementById("sidebar-brand-name");
    const brandTaglineEl = document.getElementById("sidebar-brand-tagline");
    
    const pgName = state.settings.pgName || "PGSmart Rental Application";
    const tagline = state.settings.tagline || "Smart Living. Smart Management.";

    if (brandNameEl) brandNameEl.innerHTML = pgName + `<span>.</span>`;
    if (brandTaglineEl) brandTaglineEl.innerText = tagline;
    
    // Also update document title
    document.title = `${pgName} - PG Rental Management System`;
}

function openSettingsModal() {
    const modal = document.getElementById("settings-modal");
    if (!modal) return;

    // Load current settings values into inputs
    document.getElementById("form-settings-name").value = state.settings.pgName || "";
    document.getElementById("form-settings-tagline").value = state.settings.tagline || "";
    document.getElementById("form-settings-upi").value = state.settings.upiId || "";

    tempScannerBase64 = state.settings.upiScannerQr || null;

    const previewBox = document.getElementById("settings-scanner-preview-box");
    const previewImg = document.getElementById("settings-scanner-preview");
    const filenameLabel = document.getElementById("settings-scanner-filename");
    const fileInput = document.getElementById("form-settings-scanner");
    if (fileInput) fileInput.value = ""; // reset file input

    if (tempScannerBase64) {
        if (previewImg) previewImg.src = tempScannerBase64;
        if (previewBox) previewBox.style.display = "flex";
        if (filenameLabel) filenameLabel.innerText = "Custom scanner active";
    } else {
        if (previewBox) previewBox.style.display = "none";
        if (filenameLabel) filenameLabel.innerText = "No image uploaded";
    }

    modal.classList.add("active");
}

function closeSettingsModal() {
    const modal = document.getElementById("settings-modal");
    if (modal) modal.classList.remove("active");
}

function clearSettingsScanner() {
    tempScannerBase64 = null;
    const previewBox = document.getElementById("settings-scanner-preview-box");
    const filenameLabel = document.getElementById("settings-scanner-filename");
    const fileInput = document.getElementById("form-settings-scanner");
    
    if (previewBox) previewBox.style.display = "none";
    if (filenameLabel) filenameLabel.innerText = "No image uploaded";
    if (fileInput) fileInput.value = ""; // reset file input element
}

function handleSettingsSubmit(e) {
    e.preventDefault();
    const pgName = document.getElementById("form-settings-name").value.trim();
    const tagline = document.getElementById("form-settings-tagline").value.trim();
    const upiId = document.getElementById("form-settings-upi").value.trim();

    if (!pgName || !upiId) {
        showToast("PG Name and UPI ID are required.", "error");
        return;
    }

    // Update settings in state
    state.settings.pgName = pgName;
    state.settings.tagline = tagline;
    state.settings.upiId = upiId;
    state.settings.upiScannerQr = tempScannerBase64;

    // Save and apply changes
    saveData('settings');
    applySettings();
    closeSettingsModal();
    showToast("System settings updated successfully.", "success");
}

// ----------------------------------------------------
// ONBOARDING & CLOCK SYSTEM
// ----------------------------------------------------
function initLiveClock() {
    const clockEl = document.getElementById("live-clock");
    const dateEl = document.getElementById("live-date");

    setInterval(() => {
        const now = new Date();
        if (clockEl) {
            clockEl.innerText = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        if (dateEl) {
            dateEl.innerText = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        }
    }, 1000);
}

// ----------------------------------------------------
// AUTH SYSTEM METHODS
// ----------------------------------------------------
function loadSavedCredentials() {
    const rememberMe = localStorage.getItem('pgsmart_remember_me') === 'true';
    const rememberCheckbox = document.getElementById("login-remember");
    const userField = document.getElementById("login-username");
    const passField = document.getElementById("login-password");

    if (rememberMe) {
        if (rememberCheckbox) rememberCheckbox.checked = true;
        if (userField) userField.value = localStorage.getItem('pgsmart_remember_username') || '';
        if (passField) passField.value = localStorage.getItem('pgsmart_remember_password') || '';
    } else {
        if (rememberCheckbox) rememberCheckbox.checked = false;
        if (userField) userField.value = '';
        if (passField) passField.value = '';
    }
}

function openAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.classList.add("active");
    loadSavedCredentials();
}

function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.classList.remove("active");
}

function checkAuth() {
    const btnTrigger = document.getElementById("btn-auth-trigger");
    const nameEl = document.getElementById("sidebar-admin-name");
    const roleEl = document.getElementById("sidebar-admin-role");
    const btnLogout = document.getElementById("btn-logout");
    
    if (currentUser) {
        // Logged in user
        if (btnTrigger) btnTrigger.style.display = "none";
        if (nameEl) nameEl.innerText = currentUser.fullname;
        if (roleEl) roleEl.innerText = currentUser.role || "Property Manager";
        if (btnLogout) btnLogout.style.display = "flex";
    } else {
        // Guest user
        if (btnTrigger) btnTrigger.style.display = "flex";
        if (nameEl) nameEl.innerText = "Guest User";
        if (roleEl) roleEl.innerText = "Guest Viewer";
        if (btnLogout) btnLogout.style.display = "none";
    }
}

function toggleAuthView(view) {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const subtitle = document.getElementById("auth-subtitle");

    if (view === 'signup') {
        loginForm.classList.remove("active");
        signupForm.classList.add("active");
        if (subtitle) subtitle.innerText = "Create an administrator account to manage your property.";
    } else {
        signupForm.classList.remove("active");
        loginForm.classList.add("active");
        if (subtitle) subtitle.innerText = "Welcome back. Please log in to manage your PG.";
        loadSavedCredentials();
    }
}

function handleLogin(e) {
    e.preventDefault();
    const userVal = document.getElementById("login-username").value.trim();
    const passVal = document.getElementById("login-password").value;
    const rememberCheckbox = document.getElementById("login-remember");
    const remember = rememberCheckbox ? rememberCheckbox.checked : false;

    const matchedUser = usersList.find(u => u.username.toLowerCase() === userVal.toLowerCase() && u.password === passVal);
    
    if (matchedUser) {
        currentUser = matchedUser;
        sessionStorage.setItem('pgsmart_current_user', JSON.stringify(currentUser));
        
        // Handle Remember Me credentials saving
        if (remember) {
            localStorage.setItem('pgsmart_remember_me', 'true');
            localStorage.setItem('pgsmart_remember_username', userVal);
            localStorage.setItem('pgsmart_remember_password', passVal);
        } else {
            localStorage.removeItem('pgsmart_remember_me');
            localStorage.removeItem('pgsmart_remember_username');
            localStorage.removeItem('pgsmart_remember_password');
        }

        showToast(`Welcome back, ${currentUser.fullname}!`, "success");
        
        // Re-initialize database to load user's partitioned data
        initDatabase();
        checkMonthlyRentCycle();
        checkAuth();
        closeAuthModal();

        // If not remembering, reset the login form inputs
        if (!remember) {
            document.getElementById("login-form").reset();
        }
        
        // Refresh display views
        switchView('dashboard');
    } else {
        showToast("Invalid username or password.", "error");
    }
}

function handleSignup(e) {
    e.preventDefault();
    const fullname = document.getElementById("signup-fullname").value.trim();
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value;

    if (usersList.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        showToast("Username already taken.", "error");
        return;
    }

    const newUser = {
        fullname: fullname,
        username: username,
        password: password,
        role: "Property Manager"
    };

    usersList.push(newUser);
    localStorage.setItem('pgsmart_users', JSON.stringify(usersList));
    
    // Seed new user partition with empty data (for a fresh screen)
    const userRoomsKey = `pgsmart_user_${username.toLowerCase()}_rooms`;
    const userTenantsKey = `pgsmart_user_${username.toLowerCase()}_tenants`;
    const userComplaintsKey = `pgsmart_user_${username.toLowerCase()}_complaints`;
    const userSettingsKey = `pgsmart_user_${username.toLowerCase()}_settings`;
    
    localStorage.setItem(userRoomsKey, JSON.stringify([]));
    localStorage.setItem(userTenantsKey, JSON.stringify([]));
    localStorage.setItem(userComplaintsKey, JSON.stringify([]));
    localStorage.setItem(userSettingsKey, JSON.stringify(state.settings));

    showToast("Registration successful! You can now log in.", "success");
    document.getElementById("signup-form").reset();
    toggleAuthView('login');
}

function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('pgsmart_current_user');
    showToast("Logged out to Guest Mode.", "info");
    
    // Re-initialize database back to guest partition
    initDatabase();
    checkMonthlyRentCycle();
    checkAuth();
    switchView('dashboard');
}

// ----------------------------------------------------
// BIND EVENTS & INITIALIZE APPLICATION
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize DB
    initDatabase();
    checkMonthlyRentCycle();
    checkAuth();
    loadSavedCredentials();

    // Bind Login & Signup Forms
    const loginForm = document.getElementById("login-form");
    if (loginForm) loginForm.addEventListener("submit", handleLogin);

    const signupForm = document.getElementById("signup-form");
    if (signupForm) signupForm.addEventListener("submit", handleSignup);

    // Bind System Settings Form & Custom Scanner Uploader
    const settingsForm = document.getElementById("settings-form");
    if (settingsForm) settingsForm.addEventListener("submit", handleSettingsSubmit);

    const scannerInput = document.getElementById("form-settings-scanner");
    if (scannerInput) {
        scannerInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    tempScannerBase64 = evt.target.result;
                    const previewBox = document.getElementById("settings-scanner-preview-box");
                    const previewImg = document.getElementById("settings-scanner-preview");
                    const filenameLabel = document.getElementById("settings-scanner-filename");
                    
                    if (previewImg) previewImg.src = tempScannerBase64;
                    if (previewBox) previewBox.style.display = "flex";
                    if (filenameLabel) filenameLabel.innerText = file.name;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 2. Start Onboarding Preloader removal
    setTimeout(() => {
        const preloader = document.getElementById("preloader");
        if (preloader) {
            preloader.classList.add("fade-out");
            setTimeout(() => preloader.remove(), 600);
        }
    }, 1800);

    // 3. Setup Clock
    initLiveClock();

    // 4. Bind Sidebar Navigation
    const navLinks = document.querySelectorAll(".sidebar-nav li");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            const targetView = link.getAttribute("data-view");
            if (targetView) switchView(targetView);
        });
    });

    // 5. Mobile Hamburger toggle
    const hamburger = document.getElementById("btn-mobile-toggle");
    const sidebar = document.getElementById("app-sidebar");
    if (hamburger && sidebar) {
        hamburger.addEventListener("click", () => {
            sidebar.classList.toggle("mobile-active");
        });
    }

    // 6. Bind Tenants Form & Modals
    const tenantForm = document.getElementById("tenant-form");
    if (tenantForm) tenantForm.addEventListener("submit", handleTenantSubmit);

    // Bind Tenant Search/Filters
    const searchInput = document.getElementById("tenant-search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            tenantFilters.search = e.target.value;
            tenantPageState.currentPage = 1;
            renderTenants();
        });
    }

    const filterStatus = document.getElementById("filter-tenant-status");
    if (filterStatus) {
        filterStatus.addEventListener("change", (e) => {
            tenantFilters.status = e.target.value;
            tenantPageState.currentPage = 1;
            renderTenants();
        });
    }

    const filterType = document.getElementById("filter-tenant-roomtype");
    if (filterType) {
        filterType.addEventListener("change", (e) => {
            tenantFilters.type = e.target.value;
            tenantPageState.currentPage = 1;
            renderTenants();
        });
    }

    // Voice search
    const voiceBtn = document.getElementById("btn-voice-search");
    if (voiceBtn) voiceBtn.addEventListener("click", startVoiceSearch);

    // Pagination buttons
    const btnPrev = document.getElementById("btn-tenant-prev");
    const btnNext = document.getElementById("btn-tenant-next");
    if (btnPrev) {
        btnPrev.addEventListener("click", () => {
            if (tenantPageState.currentPage > 1) {
                tenantPageState.currentPage--;
                renderTenants();
            }
        });
    }
    if (btnNext) {
        btnNext.addEventListener("click", () => {
            tenantPageState.currentPage++;
            renderTenants();
        });
    }

    // 7. Bind Rooms Form & Filters
    const roomForm = document.getElementById("room-form");
    if (roomForm) roomForm.addEventListener("submit", handleRoomSubmit);

    const roomFloorFilter = document.getElementById("filter-room-floor");
    if (roomFloorFilter) {
        roomFloorFilter.addEventListener("change", (e) => {
            roomFilters.floor = e.target.value;
            renderRooms();
        });
    }

    const roomStatusFilter = document.getElementById("filter-room-status");
    if (roomStatusFilter) {
        roomStatusFilter.addEventListener("change", (e) => {
            roomFilters.status = e.target.value;
            renderRooms();
        });
    }

    // 8. Bind Rent Payment updates Form
    const payForm = document.getElementById("pay-form");
    if (payForm) payForm.addEventListener("submit", handlePaySubmit);

    // 9. Bind Complaint Form
    const compForm = document.getElementById("complaint-log-form");
    if (compForm) compForm.addEventListener("submit", handleComplaintSubmit);

    // 10. Chatbot listeners
    const chatInput = document.getElementById("chatbot-input-field");
    if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') sendChatbotMessage();
        });
    }

    // Initialize display with default active tab
    switchView('dashboard');
});
