document.querySelector('#enterRole').addEventListener('click', () => {
    ipcRenderer.send('sendMainMessage', {
      greeting: 'Hello'
    });
  });