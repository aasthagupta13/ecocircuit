// LocalStorage Key Name
const STORAGE_KEY = "ecoCircuitDevices";

// Track currently active device in the search view
let currentTrackedDeviceId = null;

// ==========================================
// 1. INITIALIZATION & SAMPLE DATA SEEDING
// ==========================================

// Runs immediately when script loads
document.addEventListener("DOMContentLoaded", () => {
  initializeStorage();
  updateDashboard();
});

// Seeds initial sample devices ONLY IF localStorage is completely empty
function initializeStorage() {
  const existingData = localStorage.getItem(STORAGE_KEY);
  
  if (!existingData) {
    const sampleDevices = [
      { id: "LAP1024", name: "Dell Latitude", department: "IT Support", condition: 85, age: 1, recommendation: "REUSE", status: "In Use" },
      { id: "PC3091", name: "HP Workstation", department: "Software Engineering", condition: 50, age: 3, recommendation: "REPAIR", status: "Decommissioned" },
      { id: "MON5521", name: "LG Monitor", department: "Finance", condition: 20, age: 6, recommendation: "RECYCLE", status: "Collected" }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleDevices));
  }
}

// Helper to get array from LocalStorage safely
function getDevicesFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Helper to save array to LocalStorage
function saveDevicesToStorage(devices) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
}

// ==========================================
// 2. NAVIGATION BETWEEN SECTIONS
// ==========================================
function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll(".section");
  sections.forEach(sec => sec.classList.remove("active"));

  // Deactivate all nav buttons
  const buttons = document.querySelectorAll(".nav-btn");
  buttons.forEach(btn => btn.classList.remove("active"));

  // Show target section
  document.getElementById(sectionId).classList.add("active");

  // Highlight active button
  event.target.classList.add("active");

  // Auto-refresh Dashboard if switched to dashboard
  if (sectionId === "dashboard") {
    updateDashboard();
  }
}

// ==========================================
// 3. RECOMMENDATION ENGINE
// ==========================================
function calculateRecommendation(condition, age) {
  // Logic rules:
  // High condition + low age => REUSE
  // Medium condition/age => REPAIR
  // Low condition + high age => RECYCLE
  if (condition >= 70 && age <= 2) {
    return "REUSE";
  } else if (condition >= 40 && age <= 4) {
    return "REPAIR";
  } else {
    return "RECYCLE";
  }
}

// ==========================================
// 4. ADD DEVICE HANDLER
// ==========================================
function handleAddDevice(event) {
  event.preventDefault(); // Stop form from reloading page

  // Read form values
  const name = document.getElementById("deviceName").value;
  const id = document.getElementById("deviceId").value.trim().toUpperCase();
  const department = document.getElementById("department").value;
  const condition = parseInt(document.getElementById("condition").value);
  const age = parseInt(document.getElementById("age").value);

  // Validate unique ID
  const devices = getDevicesFromStorage();
  if (devices.some(dev => dev.id === id)) {
    alert("Device ID already exists! Please use a unique ID.");
    return;
  }

  // Calculate Action
  const recommendation = calculateRecommendation(condition, age);

  // Construct Device Object
  const newDevice = {
    id: id,
    name: name,
    department: department,
    condition: condition,
    age: age,
    recommendation: recommendation,
    status: "In Use"
  };

  // Save to Array and LocalStorage
  devices.push(newDevice);
  saveDevicesToStorage(devices);

  // Render UI feedback
  const recBadge = document.getElementById("resRecommendation");
  recBadge.textContent = recommendation;
  recBadge.className = `badge badge-${recommendation}`;

  document.getElementById("addResult").classList.remove("hidden");

  // Reset form inputs
  document.getElementById("deviceForm").reset();
}

// ==========================================
// 5. TRACK DEVICE HANDLER
// ==========================================
function handleTrackSearch() {
  const queryId = document.getElementById("searchInput").value.trim().toUpperCase();
  const devices = getDevicesFromStorage();

  const foundDevice = devices.find(dev => dev.id === queryId);

  const resultContainer = document.getElementById("trackResult");
  const errorMsg = document.getElementById("trackError");

  if (foundDevice) {
    currentTrackedDeviceId = foundDevice.id; // Save context for updates

    // Populate data
    document.getElementById("trackName").textContent = foundDevice.name;
    document.getElementById("trackId").textContent = foundDevice.id;
    document.getElementById("trackDept").textContent = foundDevice.department;
    document.getElementById("trackCond").textContent = foundDevice.condition;
    document.getElementById("trackAge").textContent = foundDevice.age;

    const badge = document.getElementById("trackRecBadge");
    badge.textContent = foundDevice.recommendation;
    badge.className = `badge badge-${foundDevice.recommendation}`;

    // Update Status Selection dropdown
    document.getElementById("statusSelect").value = foundDevice.status;

    // Highlight timeline
    updateTimelineUI(foundDevice.status);

    resultContainer.classList.remove("hidden");
    errorMsg.classList.add("hidden");
  } else {
    resultContainer.classList.add("hidden");
    errorMsg.classList.remove("hidden");
  }
}

// Helper to highlight timeline steps
function updateTimelineUI(currentStatus) {
  const steps = ["In Use", "Decommissioned", "Collected", "Recycling"];
  const currentIndex = steps.indexOf(currentStatus);

  steps.forEach((step, index) => {
    const element = document.getElementById(`step-${step}`);
    if (index <= currentIndex) {
      element.classList.add("active-step");
    } else {
      element.classList.remove("active-step");
    }
  });
}

// Save status updates
function handleStatusUpdate() {
  if (!currentTrackedDeviceId) return;

  const newStatus = document.getElementById("statusSelect").value;
  let devices = getDevicesFromStorage();

  // Find and update item directly in array
  devices = devices.map(dev => {
    if (dev.id === currentTrackedDeviceId) {
      return { ...dev, status: newStatus };
    }
    return dev;
  });

  saveDevicesToStorage(devices);
  updateTimelineUI(newStatus);
  alert(`Status for ${currentTrackedDeviceId} updated to: ${newStatus}`);
}

// ==========================================
// 6. DASHBOARD & METRICS HANDLER
// ==========================================
function updateDashboard() {
  const devices = getDevicesFromStorage();

  // Counters
  let countReuse = 0;
  let countRepair = 0;
  let countRecycle = 0;

  devices.forEach(dev => {
    if (dev.recommendation === "REUSE") countReuse++;
    if (dev.recommendation === "REPAIR") countRepair++;
    if (dev.recommendation === "RECYCLE") countRecycle++;
  });

  // Display totals
  document.getElementById("statTotal").textContent = devices.length;
  document.getElementById("statReuse").textContent = countReuse;
  document.getElementById("statRepair").textContent = countRepair;
  document.getElementById("statRecycle").textContent = countRecycle;

  // Update CSS Custom Bar Heights safely (prevent divide by 0)
  const max = Math.max(devices.length, 1);
  document.getElementById("barReuse").style.height = `${(countReuse / max) * 100}%`;
  document.getElementById("barRepair").style.height = `${(countRepair / max) * 100}%`;
  document.getElementById("barRecycle").style.height = `${(countRecycle / max) * 100}%`;

  // Render Table
  renderTable(devices);
}

function renderTable(devices) {
  const tbody = document.getElementById("deviceTableBody");
  tbody.innerHTML = ""; // Clear existing rows

  if (devices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No hardware registered yet.</td></tr>`;
    return;
  }

  devices.forEach(dev => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${dev.id}</strong></td>
      <td>${dev.name}</td>
      <td>${dev.department}</td>
      <td>${dev.condition}%</td>
      <td>${dev.age}y</td>
      <td><span class="badge badge-${dev.recommendation}">${dev.recommendation}</span></td>
      <td>${dev.status}</td>
      <td><button class="btn-delete" onclick="handleDeleteDevice('${dev.id}')">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Delete single device
function handleDeleteDevice(id) {
  if (confirm(`Are you sure you want to delete device ${id}?`)) {
    let devices = getDevicesFromStorage();
    devices = devices.filter(dev => dev.id !== id);
    saveDevicesToStorage(devices);
    updateDashboard();
  }
}

// Clear all data
function handleClearAll() {
  if (confirm("WARNING: This will permanently delete all saved devices. Proceed?")) {
    localStorage.removeItem(STORAGE_KEY);
    updateDashboard();
  }
}