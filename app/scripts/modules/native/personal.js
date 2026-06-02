function loadPersonalData(personaLocalData) {
  if (personaLocalData) {
    if (personaLocalData['first_name'] !== '' && personaLocalData['first_name'] !== ' ') {
      $('#firstNameInput').val(personaLocalData['first_name']);
    }
    if (personaLocalData['last_name'] !== '' && personaLocalData['last_name'] !== ' ') {
      $('#lastNameInput').val(personaLocalData['last_name']);
    }
    if (personaLocalData['job_title'] !== '' && personaLocalData['job_title'] !== ' ') {
      $('#jobTitleInput').val(personaLocalData['job_title']);
    }
    if (personaLocalData['address'] !== '' && personaLocalData['address'] !== ' ') {
      $('#addressInput').val(personaLocalData['address']);
    }
    if (personaLocalData['city'] !== '' && personaLocalData['city'] !== ' ') {
      $('#cityInput').val(personaLocalData['city']);
    }
    if (personaLocalData['state'] !== '' && personaLocalData['state'] !== ' ') {
      $('#stateInput').val(personaLocalData['state']);
    }
    if (personaLocalData['country'] !== '' && personaLocalData['country'] !== ' ') {
      $('#countryInput').val(personaLocalData['country']);
    }
    if (personaLocalData['zip_code'] !== '' && personaLocalData['zip_codee'] !== ' ') {
      $('#zipCodeInput').val(personaLocalData['zip_code']);
    }
    if (personaLocalData['email'] !== '' && personaLocalData['email'] !== ' ') {
      $('#emailInput').val(personaLocalData['email']);
    }
    if (personaLocalData['phone_number'] !== '' && personaLocalData['phone_number'] !== ' ') {
      $('#phoneNumberInput').val(personaLocalData['phone_number']);
    }
  }
}

export {loadPersonalData}

