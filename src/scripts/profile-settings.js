// Henter userens data
document.addEventListener('DOMContentLoaded', async function () {
    try {
        const response = await fetch('http://localhost:3000/api/database/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const user = await response.json();

            // Indsætter data i felterne
            document.getElementById('firstname').value = user.firstname;
            document.getElementById('lastname').value = user.lastname;
            document.getElementById('email').value = user.email;
            document.getElementById('phone').value = user.phone;
        } else {
            console.error('Kunne ikke hente user');
        }
    } catch (error) {
        console.error('Fejl ved hentning af user:', error);
    }
});

// Opdateren userens data
document.getElementById('profileForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const newPassword = document.getElementById('new-password').value;

    const profilData = {
        firstname,
        lastname,
        email,
        phone,
    };

    if (newPassword !== "") {
        profilData.newPassword = newPassword;
    }

    try {
        const response = await fetch('http://localhost:3000/api/database/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profilData)
        });

        const result = await response.json();
        if (response.ok) {
            alert('profil opdateret');
            window.location.href = '../pages/dashboard.html';
        } else {
            alert('Fejl ved opdatering af profil ', result.message)

        }
    } catch (err) {
        console.log('Fejl ved ved opdatering', err);
        alert('Fejl i respons')
    }
});

// Funktionalitet til annuler
document.getElementById('cancelButton'), document.addEventListener('click', () => {
    window.location.href = '../pages/dashboard.html';
}); 