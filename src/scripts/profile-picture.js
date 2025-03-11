// loading the page
document.addEventListener("DOMContentLoaded", function() {
    // Getting the references of the elements
    const profilePictureLink = document.querySelector(".skift-profil-billede a");
    const profilePictureImg = document.querySelector(".profile-picture img");
    const profilePictureContainer = document.querySelector('.profile-picture');

    // Create a hidden file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*'; // Accept only image files
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  // Add click event listener to "Skift profil billede" link
  if (profilePictureLink) {
    profilePictureLink.addEventListener('click', function(event) {
      event.preventDefault(); // prevents it from doing what links normally do
      fileInput.click(); // Clicks the hidden file input button
    });
  }

  // Handle the file selection
  fileInput.addEventListener('change', function() {
    const selectedFile = fileInput.files[0];

    if (selectedFile) {
      // Check if the selected file is an image
      if (!selectedFile.type.startsWith('image/')) {
        alert('Vælg venligst et billedformat (JPG, PNG, etc.).');
        return;
      }

      // Create a FileReader to read the selected image
      const reader = new FileReader();

      // Set up the FileReader onload event
      reader.onload = function(event) {
        // Update the profile picture with the selected image
        profilePictureImg.src = event.target.result;

        // When we get our database and server up and going, we can save it here
        // This is just a placeholder
        saveProfilePicture(selectedFile);
      };

      // Read the image file as a data URL
      reader.readAsDataURL(selectedFile);
    }
  });

  // Function to save the profile picture to the server (placeholder)
  function saveProfilePicture(file) {
    // For now i just console.log it instead of actually saving the file
    console.log('Profile picture changed. Would upload file:', file.name);


    // I am just showing a success message with an alert for now
    setTimeout(() => {
      alert('Profilbillede opdateret!');
    }, 500);
  }

})