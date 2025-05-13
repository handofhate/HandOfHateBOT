// ==============================================
//               tooltipManager.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const marked = require('marked');

let activeHelpModal = null;

// ==============================================
//                 Modal Creation
// ==============================================

function showMarkdownModal(title, content) {
  if (activeHelpModal && activeHelpModal.dataset.title === title) {
    document.body.removeChild(activeHelpModal);
    activeHelpModal = null;
    return null;
  }

  const existingModal = document.getElementById('helpModal');
  if (existingModal) {
    document.body.removeChild(existingModal);
    activeHelpModal = null;
  }

  const modalContent = document.createElement('div');
  modalContent.className = 'fixed z-50 inset-0 flex items-center justify-center bg-black/50';
  modalContent.id = 'helpModal';
  modalContent.dataset.title = title;

  const modalBox = document.createElement('div');
  modalBox.className =
    'bg-base-200 rounded-lg shadow-xl w-auto max-w-[90vw] max-h-[85vh] flex flex-col relative';
  modalBox.style.minWidth = '320px';

  const closeButton = document.createElement('button');
  closeButton.className = 'btn btn-sm btn-ghost absolute z-10';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '8px';
  closeButton.style.right = '8px';
  closeButton.innerHTML = '✕';
  closeButton.onclick = (e) => {
    e.stopPropagation();
    document.body.removeChild(modalContent);
    activeHelpModal = null;
  };

  const modalBody = document.createElement('div');
  modalBody.className = 'overflow-y-auto p-4 flex-grow markdown-body';

  try {
    modalBody.innerHTML = marked.parse(content);
  } catch (error) {
    modalBody.textContent = content;
  }

  modalBox.appendChild(closeButton);
  modalBox.appendChild(modalBody);
  modalContent.appendChild(modalBox);

  modalContent.tabIndex = 0;
  modalContent.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.body.removeChild(modalContent);
      activeHelpModal = null;
    }
  });

  modalContent.addEventListener('click', (e) => {
    if (e.target === modalContent) {
      document.body.removeChild(modalContent);
      activeHelpModal = null;
    }
  });

  document.body.appendChild(modalContent);

  // ==============================================
  //     Optional Post-Render Enhancements
  // ==============================================

  if (title === 'About VOiD') {
    const socials = modalContent.querySelector('#void-social-buttons');
    if (socials) {
      socials.innerHTML = `
<div class="mt-6 flex justify-center flex-wrap gap-4 text-base-content">

  <!-- Discord -->
  <a
    href="https://discord.gg/fzjCEcsVns"
    target="_blank"
    class="btn btn-circle btn-ghost flex items-center justify-center"
    title="Discord"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
      <path d="M17.472 3.749A13.227 13.227 0 0 0 14.85 3c-.119.211-.252.497-.345.72a12.418 12.418 0 0 0-4.908 0 11.814 11.814 0 0 0-.362-.72 13.233 13.233 0 0 0-2.622.749C2.63 8.401 1.844 12.97 2.179 17.479a13.3 13.3 0 0 0 4.003 2.021 9.802 9.802 0 0 0 .855-1.386 8.7 8.7 0 0 1-1.35-.63c.113-.082.224-.166.33-.254a9.575 9.575 0 0 0 8.554 0c.106.088.217.172.33.254a8.676 8.676 0 0 1-1.35.63c.244.494.53.964.855 1.386a13.28 13.28 0 0 0 4.003-2.02c.37-4.637-.62-9.164-3.29-13.73Z" />
      <path d="M15.285 14.432c0-.789-.53-1.43-1.182-1.43-.652 0-1.183.64-1.183 1.43 0 .788.53 1.43 1.183 1.43.652 0 1.182-.642 1.182-1.43Zm-4.603 0c0-.789-.53-1.43-1.183-1.43-.652 0-1.182.64-1.182 1.43 0 .788.53 1.43 1.182 1.43.652 0 1.183-.642 1.183-1.43Z" />
    </svg>
  </a>

  <!-- Twitch -->
  <a
    href="https://twitch.tv/handofhate"
    target="_blank"
    class="btn btn-circle btn-ghost flex items-center justify-center"
    title="Twitch"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
      <path d="M4 4v16l4-4h4l4 4V4H4Z" />
      <path d="M16 4v16" />
      <path d="M12 10v4" />
    </svg>
  </a>

  <!-- Instagram -->
  <a
    href="https://instagram.com/handofhate"
    target="_blank"
    class="btn btn-circle btn-ghost flex items-center justify-center"
    title="Instagram"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
    </svg>
  </a>

  <!-- Facebook -->
  <a
    href="https://facebook.com/handofhate"
    target="_blank"
    class="btn btn-circle btn-ghost flex items-center justify-center"
    title="Facebook"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
      <path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v9h4v-9h3l1-4h-4V6a1 1 0 0 1 1-1h3Z" />
    </svg>
  </a>

  <!-- GitHub -->
  <a
    href="https://github.com/handofhate/VOiD"
    target="_blank"
    class="btn btn-circle btn-ghost flex items-center justify-center"
    title="GitHub"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  </a>

  <!-- Email -->
  <a
    href="mailto:handofhate666@gmail.com"
    class="btn btn-circle btn-ghost flex items-center justify-center"
    title="handofhate666@gmail.com"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
      <rect width="20" height="16" x="2" y="4" rx="2" ry="2" />
      <path d="M22 6 12 13 2 6" />
    </svg>
  </a>
</div>
    `;
    }
  }

  modalContent.focus();

  activeHelpModal = modalContent;
  return modalContent;
}

// ==============================================
//                    Exports
// ==============================================

module.exports = {
  showMarkdownModal,
};
