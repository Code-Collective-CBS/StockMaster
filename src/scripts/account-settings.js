const button = document.getElementById("createAcc")
const kontonavn = document.getElementById("kontonavn")
const valuta = document.getElementById("valuta");
const hej = document.getElementById("status");

button.addEventListener("click", async () => {
    const data = {
        account_name: kontonavn.value,
        currency: valuta.value,
        state: hej.value
    };

    try {
        const res = await fetch('/api/create-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            alert(result.message || 'Konto oprettet!');
        } else {
            alert(result.message || 'Noget gik galt');
        }
    } catch (err) {
        console.error('Fejl ved oprettelse:', err);
        alert('Serverfejl ved oprettelse af konto');
    }
});