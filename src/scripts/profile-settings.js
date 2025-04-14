// Henter userens data
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/database/profileInfo', {
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

            // Sæt avatar-billede
            if (user.avatar) {
                const avatarURL = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.avatar}`;
                document.getElementById('profile-avatar').src = avatarURL;
                console.log("Avatar seed:", user.avatar);
            }

            // Checks if an avatar is selected
            const avatars = document.querySelectorAll('.avatar-option');
            avatars.forEach((avatarElement) => {
                if (avatarElement.dataset.avatar === user.avatar) {
                    avatarElement.classList.add('selected');
                }
            });

        } else {
            console.error('Kunne ikke hente user');
        }
    } catch (error) {
        console.error('Fejl ved hentning af user:', error);
    }
});

// Opdateren userens data
document.getElementById('profileForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const phone_number = document.getElementById('phone').value;
    const newPassword = document.getElementById('new-password').value;

    const selectedAvatar = document.querySelector('.avatar-option.selected');

    // Checks for selected avatar
    let avatar;
    if (selectedAvatar) {
        avatar = selectedAvatar.dataset.avatar;
    } else {
        avatar = null;
    }

    const profilData = {
        firstname,
        lastname,
        email,
        phone_number,
        avatar
    };

    if (newPassword !== '') {
        profilData.newPassword = newPassword;
    }

    try {
        const response = await fetch('http://localhost:3000/api/database/updateprofileInfo', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profilData)
        });

        const result = await response.json();
        if (response.ok) {
            alert('profil opdateret');
        } else {
            alert('Fejl ved opdatering af profil ', result.message)

        }
    } catch (err) {
        console.log('Fejl ved ved opdatering', err);
        alert('Fejl i respons')
    }
});

// Avatar choosing. 
document.addEventListener('DOMContentLoaded', () => {
    const avatarOptions = document.querySelectorAll('.avatar-option');

    avatarOptions.forEach((avatar) => {
        avatar.addEventListener('click', () => {
            avatarOptions.forEach((avatarElement) => avatarElement.classList.remove('selected'));
            avatar.classList.add('selected');

            // Opdater preview
            const avatarSeed = avatar.dataset.avatar;
            const avatarURL = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`;
            document.getElementById('profile-avatar').src = avatarURL;
        });
    });
});

// Funktionalitet til annuler
document.getElementById('cancelButton').addEventListener('click', () => {
    window.location.href = '../pages/dashboard.html';
});
