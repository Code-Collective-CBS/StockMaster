export const portfolio = {

    createPortfolio: async () => {
        document.addEventListener('DOMContentLoaded', () => {
            const addPortfolioButton = document.getElementById('addPortfolioButton')

            // Open pop-up
            addPortfolioButton.addEventListener('click', () => {


                // Save portfolio
                document.getElementById('savePortfolioButton').addEventListener('click', async () => {
                    const portfolioName = document.getElementById('portfolioNameInput').value.trim()

                    if (portfolioName === '') alert('Please enter a name')

                    try {
                        const response = await fetch('http://localhost:3000/api/database/createPortfolio', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                portfolioName
                            })
                        });

                        const result = await response.json();
                        if (response.status === 200) {
                            alert("Portfolio succesfully created");
                            portfolioPopup.style.display = 'none';
                            portfolioName = '';
                        } else {
                            alert("Fail: " + result.message)
                        }
                    } catch (err) {
                        console.log('Failed to create portfolio' + err)
                        alert('Failed to create portfolio')
                    }
                });
            }); // Add portfolio button
        }); // DOMContentLoaded
    } // Method
}; // Export object


export const portfolio = {
    createPortfolio: () => {
      const addPortfolioButton = document.getElementById('addPortfolioButton');
  
      if (!addPortfolioButton) return console.log('Could not find #addPortfolioButton');
  
      addPortfolioButton.addEventListener('click', () => {
        // If pop-up already exists - do nothing.
        if (document.getElementById('portfolioPopupModal')) return;
  
        // Otherwise - build modal
        const modal = document.createElement('div');
        modal.id = 'portfolioPopupModal';
        modal.classList.add('modal-wrapper');
  
        modal.innerHTML = `
          <div class="modal-overlay"></div>
          <div class="modal-content">
            <span class="modal-close">&times;</span>
            <div class="modal-form">
              <h2>Tilføj portefølje</h2>
              <input type="text" id="portfolioNameInput" placeholder="Portfolio name" />
              <button id="savePortfolioButton" class="btn btn-primary">Gem</button>
            </div>
          </div>
        `;
  
        document.body.appendChild(modal);
  
        // Close pop-up
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());
  
        // Save portfolio
        modal.querySelector('#savePortfolioButton').addEventListener('click', async () => {
          const nameInput = modal.querySelector('#portfolioNameInput');
          const portfolioName = nameInput.value.trim();
  
          if (portfolioName === '') {
            alert('Please enter a portfolio name');
            return;
          }
  
          try {
            const response = await fetch('http://localhost:3000/api/database/createPortfolio', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ portfolioName })
            });
  
            const result = await response.json();
  
            if (response.status === 200) {
              alert('Portfolio successfully created');
              modal.remove();
            } else {
              alert('Failed: ' + result.message);
            }
          } catch (err) {
            console.error('Failed to create portfolio:', err);
            alert('Failed to create portfolio');
          }
        });
      });
    }
  };
  