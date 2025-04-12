const getUserInfo = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/database/userInfo')
        if (response.ok) {
            const data = await response.json()
            document.getElementById('profile-name').textContent = `${data.fornavn}${data.efternavn}`
        } else {
            document.getElementById('profile-name').textContent = 'N/A'
        }
    } catch(err) {
        console.err('Kunne ikke hente brugeren', err)
        document.getElementById('profile-name').textContent = 'N/A'
        throw err;
    }
};

window.addEventListener('DOMContentLoaded', getUserInfo);

