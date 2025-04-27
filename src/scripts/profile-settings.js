// Collect user data
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Use sessionstorrage
        const avatarSeed = sessionStorage.getItem('userAvatar');

        // Fetching firstname, lastname, email, phone
        const response = await fetch('http://localhost:3000/api/database/profileInfo', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const user = await response.json();
            console.log('User received:', user);


            // Fills data into the fields
            document.getElementById('firstname').value = user.firstname;
            document.getElementById('lastname').value = user.lastname;
            document.getElementById('email').value = user.email;
            document.getElementById('phone').value = user.phone_number;

            // Uses the first valid. If sessionstorrage exists use that either use avatar from Database
            const avatarToUse = avatarSeed || user.avatar;


            // Sets the avatar-picture
            if (avatarToUse) {
                const avatarURL = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarToUse}`;
                const avatarElement = document.getElementById('profile-settings-avatar')
                document.getElementById('profile-settings-avatar').src = avatarURL;
                if (avatarElement) avatarElement.src = avatarURL;
            }

            // If we used database avatar then update sessionstorrage
            if (!avatarSeed) {
                sessionStorage.setItem('userAvatar', user.avatar);
            }

            // Checks if an avatar is selected
            const avatars = document.querySelectorAll('.avatar-option');
            avatars.forEach((avatarElement) => {
                if (avatarElement.dataset.avatar === avatarToUse) {
                    avatarElement.classList.add('selected');
                }
            });

        } else {
            console.error('Could not fetch user');
        }
    } catch (error) {
        console.error('Error fetching the user:', error);
    }
});

// Updates the users data
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
            alert('Profile settings changed');

            // Update sessionStorage with new avatar if changed
            if (avatar) {
                sessionStorage.setItem('userAvatar', avatar);
            }
            sessionStorage.setItem('userFirstname', firstname);
            sessionStorage.setItem('userLastname', lastname);

            // Reload page
            window.location.reload();

        } else {
            alert('Error changing profile settings: ' + result.message);
        }

    } catch (error) {
        console.log('Error changing profile settings', error);
        alert('Fail in response');
    }
});


// Avatar choosing. 
document.addEventListener('DOMContentLoaded', () => {
    const avatarOptions = document.querySelectorAll('.avatar-option');

    avatarOptions.forEach((avatar) => {
        avatar.addEventListener('click', () => {
            // Removes selected so only one is selected
            avatarOptions.forEach((avatarElement) => avatarElement.classList.remove('selected'));
            avatar.classList.add('selected');

            // Updates preview
            const avatarSeed = avatar.dataset.avatar;
            const avatarURL = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`;

            // Checks for preview and sets the image to the choosen one
            const avatarElementPreview = document.getElementById('profile-settings-avatar');
            if (avatarElementPreview) avatarElementPreview.src = avatarURL;
        });
    });
});

// Functionality for cancelling 
document.getElementById('cancelButton').addEventListener('click', () => {
    window.location.href = '../pages/dashboard.html';
});
