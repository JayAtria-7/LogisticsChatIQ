/**
 * LogisticsChatIQ - Web Client Application
 * Author: Jay Atria
 * GitHub: https://github.com/JayAtria-7
 * License: MIT
 * Description: Frontend JavaScript for real-time chat interface and package management
 */

// ========================================
// Application State
// ========================================
class ChatApp {
  constructor() {
    this.socket = null;
    this.sessionId = null;
    this.packages = [];
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  // ========================================
  // Initialization
  // ========================================
  init() {
    this.initTheme();
    this.connectSocket();
    this.attachEventListeners();
    this.autoResizeTextarea();
    this.initFileUpload();
  }

  initTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  // ========================================
  // Socket Connection
  // ========================================
  connectSocket() {
    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:5000';
    
    this.socket = io(window.location.origin || 'http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    this.socket.once('connect', () => {
      this.updateConnectionStatus('connected');
      this.showToast('Connected to server', 'success');
      this.socket.emit('init-session', this.sessionId);
    });

    this.socket.on('disconnect', () => {
      this.updateConnectionStatus('disconnected');
      this.showToast('Connection lost', 'error');
    });

    this.socket.on('bot-response', (response) => {
      this.hideTyping();
      this.addBotMessage(response.message, response.suggestions);
      if (response.sessionId) {
        this.sessionId = response.sessionId;
      }
      this.updateSessionData();
    });

    this.socket.on('session-data', (data) => {
      this.packages = data.packages || [];
      this.updatePackagesList();
      this.updateTotalCost();
    });

    this.socket.on('costs-calculated', (data) => {
      this.updateTotalCost(data.totalCost);
    });

    this.socket.on('export-complete', (data) => {
      this.downloadExport(data.format, data.data);
      this.showToast(`Exported as ${data.format.toUpperCase()}`, 'success');
    });

    this.socket.on('error', (error) => {
      this.showToast(error.message || 'An error occurred', 'error');
    });
  }

  // ========================================
  // Event Listeners
  // ========================================
  attachEventListeners() {
    // Send message
    const sendBtn = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');
    
    sendBtn.addEventListener('click', () => this.sendMessage());
    
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    chatInput.addEventListener('input', (e) => {
      const charCount = document.getElementById('char-count');
      charCount.textContent = e.target.value.length;
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => this.toggleTheme());

    // Summary button
    const summaryBtn = document.getElementById('summary-btn');
    summaryBtn.addEventListener('click', () => this.toggleSidebar());

    // Sidebar close
    const closeSidebar = document.getElementById('close-sidebar');
    closeSidebar.addEventListener('click', () => this.toggleSidebar());

    // Export button
    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('click', () => this.showExportModal());

    // Import button
    const importBtn = document.getElementById('import-btn');
    importBtn.addEventListener('click', () => this.showImportModal());

    // Export modal
    const closeExportModal = document.getElementById('close-export-modal');
    closeExportModal.addEventListener('click', () => this.hideExportModal());

    const exportOptions = document.querySelectorAll('.export-option');
    exportOptions.forEach(option => {
      option.addEventListener('click', () => {
        const format = option.getAttribute('data-format');
        this.exportData(format);
      });
    });

    // Import modal
    const closeImportModal = document.getElementById('close-import-modal');
    closeImportModal.addEventListener('click', () => this.hideImportModal());

    const uploadBtn = document.getElementById('upload-btn');
    uploadBtn.addEventListener('click', () => this.uploadFile());

    // Close modal on backdrop click
    const exportModal = document.getElementById('export-modal');
    exportModal.addEventListener('click', (e) => {
      if (e.target === exportModal) {
        this.hideExportModal();
      }
    });

    const importModal = document.getElementById('import-modal');
    importModal.addEventListener('click', (e) => {
      if (e.target === importModal) {
        this.hideImportModal();
      }
    });
  }

  // ========================================
  // Message Handling
  // ========================================
  sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || !this.socket) return;

    this.addUserMessage(message);
    this.socket.emit('user-message', message);
    
    input.value = '';
    document.getElementById('char-count').textContent = '0';
    this.showTyping();
    this.scrollToBottom();
  }

  addUserMessage(text) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageEl = this.createMessageElement('user', text);
    messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  addBotMessage(text, suggestions = []) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageEl = this.createMessageElement('bot', text);
    messagesContainer.appendChild(messageEl);
    
    if (suggestions && suggestions.length > 0) {
      this.showSuggestions(suggestions);
    } else {
      this.hideSuggestions();
    }
    
    this.scrollToBottom();
  }

  createMessageElement(type, text) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    content.appendChild(bubble);
    content.appendChild(time);
    message.appendChild(avatar);
    message.appendChild(content);
    
    return message;
  }

  showTyping() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (!typingIndicator.querySelector('.message-avatar')) {
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.textContent = '🤖';
      
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        bubble.appendChild(dot);
      }
      
      typingIndicator.innerHTML = '';
      typingIndicator.appendChild(avatar);
      typingIndicator.appendChild(bubble);
    }
    
    typingIndicator.style.display = 'flex';
    this.scrollToBottom();
  }

  hideTyping() {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.style.display = 'none';
  }

  showSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('suggestions');
    suggestionsContainer.innerHTML = '';
    
    suggestions.forEach(suggestion => {
      const chip = document.createElement('button');
      chip.className = 'suggestion-chip';
      chip.textContent = suggestion;
      chip.addEventListener('click', () => {
        document.getElementById('chat-input').value = suggestion;
        this.sendMessage();
      });
      suggestionsContainer.appendChild(chip);
    });
  }

  hideSuggestions() {
    document.getElementById('suggestions').innerHTML = '';
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  }

  // ========================================
  // Package Management
  // ========================================
  updateSessionData() {
    if (this.socket) {
      this.socket.emit('get-session-data');
      this.socket.emit('calculate-costs');
    }
  }

  updatePackagesList() {
    const packagesList = document.getElementById('packages-list');
    
    if (this.packages.length === 0) {
      packagesList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <p>No packages yet</p>
          <small>Start adding packages through chat</small>
        </div>
      `;
      return;
    }

    packagesList.innerHTML = '';
    
    this.packages.forEach((pkg, index) => {
      const card = document.createElement('div');
      card.className = 'package-card';
      
      card.innerHTML = `
        <div class="package-header">
          <span class="package-id">Package ${index + 1}</span>
          <span class="package-badge">${pkg.type || 'Unknown'}</span>
        </div>
        <div class="package-details">
          ${pkg.dimensions ? `<div>📏 ${pkg.dimensions.length}×${pkg.dimensions.width}×${pkg.dimensions.height} ${pkg.dimensions.unit}</div>` : ''}
          ${pkg.weight ? `<div>⚖️ ${pkg.weight.value} ${pkg.weight.unit}</div>` : ''}
          ${pkg.destination ? `<div>📍 ${pkg.destination.city}, ${pkg.destination.country}</div>` : ''}
        </div>
        <div class="package-cost">Calculating...</div>
      `;
      
      packagesList.appendChild(card);
    });
  }

  updateTotalCost(total) {
    const totalCostEl = document.getElementById('total-cost');
    if (total !== undefined) {
      totalCostEl.querySelector('strong').textContent = `$${total.toFixed(2)}`;
    }
  }

  // ========================================
  // UI Controls
  // ========================================
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);
    
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
  }

  showExportModal() {
    const modal = document.getElementById('export-modal');
    modal.classList.add('active');
  }

  hideExportModal() {
    const modal = document.getElementById('export-modal');
    modal.classList.remove('active');
  }

  showImportModal() {
    const modal = document.getElementById('import-modal');
    modal.classList.add('active');
    this.resetImportForm();
  }

  hideImportModal() {
    const modal = document.getElementById('import-modal');
    modal.classList.remove('active');
    this.resetImportForm();
  }

  resetImportForm() {
    const fileInput = document.getElementById('file-input');
    const uploadInfo = document.getElementById('upload-info');
    const uploadArea = document.getElementById('upload-area');
    const importResult = document.getElementById('import-result');
    const uploadBtn = document.getElementById('upload-btn');

    fileInput.value = '';
    uploadInfo.style.display = 'none';
    uploadArea.style.display = 'block';
    importResult.style.display = 'none';
    importResult.className = 'import-result';
    importResult.innerHTML = '';
    uploadBtn.disabled = true;
  }

  initFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadInfo = document.getElementById('upload-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const removeFileBtn = document.getElementById('remove-file');
    const uploadBtn = document.getElementById('upload-btn');

    // Click to select file
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });

    // File selected
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFileSelect(file);
      }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (file) {
        fileInput.files = e.dataTransfer.files;
        this.handleFileSelect(file);
      }
    });

    // Remove file
    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.resetImportForm();
    });
  }

  handleFileSelect(file) {
    const uploadArea = document.getElementById('upload-area');
    const uploadInfo = document.getElementById('upload-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const uploadBtn = document.getElementById('upload-btn');
    const importResult = document.getElementById('import-result');

    // Validate file type
    const allowedExtensions = ['.csv', '.json', '.pdf', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      this.showToast('Invalid file type. Please upload CSV, JSON, PDF, or TXT files.', 'error');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      this.showToast('File too large. Maximum size is 10MB.', 'error');
      return;
    }

    // Display file info
    fileName.textContent = file.name;
    fileSize.textContent = this.formatFileSize(file.size);
    uploadArea.style.display = 'none';
    uploadInfo.style.display = 'block';
    importResult.style.display = 'none';
    uploadBtn.disabled = false;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async uploadFile() {
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const importResult = document.getElementById('import-result');

    if (!fileInput.files || fileInput.files.length === 0) {
      this.showToast('Please select a file first', 'error');
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    // Always send sessionId (can be null, server will create one)
    formData.append('sessionId', this.sessionId || '');

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span>⏳</span> Uploading...';

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update sessionId if it was created by the server
      if (result.sessionId && !this.sessionId) {
        this.sessionId = result.sessionId;
      }

      // Display result
      this.displayImportResult(result);

      // Handle incomplete packages
      if (result.incompletePackages && result.incompletePackages.length > 0) {
        this.showCompletePackageModal(result.incompletePackages, result.sessionId);
      }

      // Update UI if successful
      if (result.success && result.successfulImports > 0) {
        this.updateSessionData();
        this.showToast(`Successfully imported ${result.successfulImports} package(s)!`, 'success');
      }
    } catch (error) {
      console.error('Upload error:', error);
      this.showToast(`Import failed: ${error.message}`, 'error');
      importResult.style.display = 'block';
      importResult.className = 'import-result error';
      importResult.innerHTML = `<strong>❌ Import Failed</strong><p>${error.message}</p>`;
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = '<span>⬆️</span> Upload & Import';
    }
  }

  displayImportResult(result) {
    const importResult = document.getElementById('import-result');
    importResult.style.display = 'block';

    if (result.success) {
      importResult.className = 'import-result success';
      let html = `
        <strong>✅ Import Successful</strong>
        <div class="import-stats">
          <div>📦 Total Records: ${result.totalRecords}</div>
          <div>✓ Successfully Imported: ${result.successfulImports}</div>
          ${result.failedImports > 0 ? `<div>✗ Failed: ${result.failedImports}</div>` : ''}
          ${result.incompletePackages && result.incompletePackages.length > 0 ? 
            `<div>⚠️ Incomplete: ${result.incompletePackages.length}</div>` : ''}
        </div>
      `;

      if (result.warnings && result.warnings.length > 0) {
        html += `
          <div class="import-errors">
            <strong>Warnings:</strong>
            <ul>
              ${result.warnings.slice(0, 5).map(w => `<li>Row ${w.row}: ${w.message}</li>`).join('')}
              ${result.warnings.length > 5 ? `<li>... and ${result.warnings.length - 5} more</li>` : ''}
            </ul>
          </div>
        `;
      }

      if (result.errors && result.errors.length > 0) {
        html += `
          <div class="import-errors">
            <strong>Errors:</strong>
            <ul>
              ${result.errors.slice(0, 5).map(e => `<li>Row ${e.row}: ${e.message}</li>`).join('')}
              ${result.errors.length > 5 ? `<li>... and ${result.errors.length - 5} more</li>` : ''}
            </ul>
          </div>
        `;
      }

      importResult.innerHTML = html;
    } else {
      importResult.className = 'import-result error';
      let html = `
        <strong>❌ Import Failed</strong>
        <div class="import-stats">
          <div>Total Records: ${result.totalRecords}</div>
        </div>
      `;

      if (result.errors && result.errors.length > 0) {
        html += `
          <div class="import-errors">
            <strong>Errors:</strong>
            <ul>
              ${result.errors.slice(0, 5).map(e => `<li>${e.row > 0 ? `Row ${e.row}: ` : ''}${e.message}</li>`).join('')}
              ${result.errors.length > 5 ? `<li>... and ${result.errors.length - 5} more</li>` : ''}
            </ul>
          </div>
        `;
      }

      importResult.innerHTML = html;
    }
  }

  exportData(format) {
    if (this.socket) {
      this.socket.emit('export-data', format);
      this.hideExportModal();
    }
  }

  downloadExport(format, data) {
    // Special handling for PDF (HTML format)
    if (format === 'pdf') {
      // Open HTML in new window for printing to PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(data);
      printWindow.document.close();
      
      // Trigger print dialog after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 250);
      
      return;
    }
    
    // Regular file download for other formats
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 
           format === 'csv' ? 'text/csv' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packages-${Date.now()}.${format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  updateConnectionStatus(status) {
    const statusEl = document.getElementById('connection-status');
    statusEl.className = `connection-status ${status}`;
    
    const statusText = statusEl.querySelector('.status-text');
    statusText.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'toastSlide 0.3s ease reverse';
      setTimeout(() => {
        container.removeChild(toast);
      }, 300);
    }, 3000);
  }

  autoResizeTextarea() {
    const textarea = document.getElementById('chat-input');
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }

  showCompletePackageModal(incompletePackages, sessionId) {
    const modal = document.getElementById('complete-package-modal');
    const list = document.getElementById('incomplete-packages-list');
    
    // Store for later use
    this.currentIncompletePackages = incompletePackages;
    this.currentSessionId = sessionId;
    
    // Build form for each incomplete package
    let html = '';
    incompletePackages.forEach((incomplete, index) => {
      const requiredFields = incomplete.missingFields.filter(f => f.required);
      const optionalFields = incomplete.missingFields.filter(f => !f.required);
      
      html += `
        <div class="incomplete-package-item" data-incomplete-id="${incomplete.id}">
          <div class="incomplete-package-header">
            <h4>Package ${index + 1}</h4>
            <span class="missing-badge">${requiredFields.length} Required Fields</span>
          </div>
          <div class="form-grid">
            ${incomplete.missingFields.map(field => this.renderFormField(field, incomplete.partialData)).join('')}
          </div>
        </div>
      `;
    });
    
    list.innerHTML = html;
    modal.style.display = 'flex';
    
    // Add event listeners
    const closeBtn = document.getElementById('close-complete-modal');
    const skipBtn = document.getElementById('skip-incomplete');
    const submitBtn = document.getElementById('submit-complete');
    
    closeBtn.onclick = () => this.hideCompletePackageModal();
    skipBtn.onclick = () => this.hideCompletePackageModal();
    submitBtn.onclick = () => this.submitCompletePackages();
  }

  renderFormField(field, partialData) {
    const value = this.getNestedValue(partialData, field.field) || '';
    const required = field.required ? 'required' : '';
    const requiredClass = field.required ? 'required' : '';
    
    if (field.type === 'select' && field.options) {
      return `
        <div class="form-field">
          <label class="${requiredClass}">${field.label}</label>
          <select name="${field.field}" ${required}>
            <option value="">Select...</option>
            ${field.options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </div>
      `;
    } else if (field.type === 'boolean') {
      return `
        <div class="form-field">
          <label>
            <input type="checkbox" name="${field.field}" ${value ? 'checked' : ''}>
            ${field.label}
          </label>
        </div>
      `;
    } else if (field.type === 'number') {
      return `
        <div class="form-field">
          <label class="${requiredClass}">${field.label}</label>
          <input type="number" name="${field.field}" value="${value}" ${required} step="0.01" min="0">
        </div>
      `;
    } else {
      return `
        <div class="form-field">
          <label class="${requiredClass}">${field.label}</label>
          <input type="text" name="${field.field}" value="${value}" ${required}>
        </div>
      `;
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  async submitCompletePackages() {
    const items = document.querySelectorAll('.incomplete-package-item');
    
    for (const item of items) {
      const incompleteId = item.dataset.incompleteId;
      const fields = item.querySelectorAll('input, select');
      const fieldValues = { partialData: this.currentIncompletePackages.find(p => p.id === incompleteId).partialData };
      
      fields.forEach(field => {
        if (field.type === 'checkbox') {
          fieldValues[field.name] = field.checked;
        } else {
          fieldValues[field.name] = field.value;
        }
      });
      
      try {
        const response = await fetch('/api/import/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.currentSessionId,
            incompleteId,
            fieldValues
          })
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to complete package');
        }
        
        this.showToast('Package completed successfully!', 'success');
      } catch (error) {
        console.error('Error completing package:', error);
        this.showToast(`Failed to complete package: ${error.message}`, 'error');
        return; // Stop processing if one fails
      }
    }
    
    // Update session data and close modal
    this.updateSessionData();
    this.hideCompletePackageModal();
    this.hideImportModal();
  }

  hideCompletePackageModal() {
    const modal = document.getElementById('complete-package-modal');
    modal.style.display = 'none';
    this.currentIncompletePackages = null;
    this.currentSessionId = null;
  }
}

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Prevent multiple instances
  if (window.chatApp) {
    console.warn('ChatApp already initialized');
    return;
  }
  
  const app = new ChatApp();
  window.chatApp = app; // For debugging
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (app.socket) {
      app.socket.disconnect();
    }
  });
});
