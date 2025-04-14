export const portfolio = {
    
    createPortfolio: async () => {
        document.addEventListener('DOMContentLoaded', () => {
            const portfolioPopup = document.getElementById('portfolioPopup');

            // Self-note: Link this script to all html-pages
            const addPortfolioButton = document.getElementById('addPortfolioButton')

            // Open pop-up
            addPortfolioButton.addEventListener('click', () => {
                portfolioPopup.style.display = 'block'
            });

            // Close pop-up
            document.getElementById('closePopup').addEventListener('click', () => {
                portfolioPopup.style.display = 'none';
            });

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
        }); // DOMContentLoaded
    } // Method
}; // Export object