class Person {
    constructor(name, surname, mail) {
        this.name = name;
        this.surname = surname;
        this.mail = mail;
    }
}

class Util {
    static controlEmptyArea(...Areas) {
        let result = true;
        Areas.forEach(area => {
            if (area.length === 0) {
                result = false;
                return false;
            }
        });
        return result;
    }

    static isEmailValid(email) { //The Regular Expression for Email Validation.
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
}

class Screen {
    constructor() {
        this.name = document.getElementById('name');
        this.surname = document.getElementById('surname');
        this.mail = document.getElementById('mail');
        this.addUpdateButton = document.querySelector('.saveUpdate');
        this.form = document.getElementById('form-contacts');
        this.form.addEventListener('submit', this.saveUpdate.bind(this));
        this.personList = document.querySelector('.person-list');
        this.personList.addEventListener('click', this.updateOrDelete.bind(this));

        //localStorage islemleri için kullanılır
        this.db = new LocalStorage();
        //update ve delete butonlarına basıldıgında
        //ilgili tr elementi burda tutulur.
        this.selectedRow = undefined;
        this.printPersonsOnScreeen();
    }

    infoCreate(message, content) {

        const warningDiv = document.querySelector('.information');

        warningDiv.innerHTML = message ;

        warningDiv.classList.add(content ? 'information--success' : 'information--error');


        //setTimeOut, setInterval
        setTimeout(function() {
            warningDiv.className = 'information';
        }, 2000);

    }

    saveUpdate(e) {
        e.preventDefault();
        const person = new Person(this.name.value, this.surname.value, this.mail.value);
        const resultt = Util.controlEmptyArea(person.name, person.surname, person.mail);
        const isEmailValid = Util.isEmailValid(this.mail.value);
        console.log(this.mail.value + " result of Email control:" + isEmailValid);
        //tüm alanlar doldurulmus
        if (resultt) {

            if (!isEmailValid) {
                this.infoCreate('Please Enter a Valid Email', false);
                return;
            }

            if (this.selectedRow) {
                //secilen satır undefined değilse güncellenecek demektir
                this.updatePersonOnScreen(person);
            } else {
                //secilen satır undefined ise ekleme yapılacaktır
                //yeni kişiyi ekrana ekler

                //localStorage ekle
                const res = this.db.addPerson(person);
                console.log("result :" + res + " inside the saveUpdate.");
                if (res) {
                    this.infoCreate('Successfully Added.', true);
                    this.addPersonOnScreen(person);
                    this.clearAreas();
                } else {
                    this.infoCreate('This Email has already been taken.', false);
                }

            }


        } else { //bazı alanlar eksik
            this.infoCreate('Please Fill Empty Areas.', false);
        }
    }

    clearAreas() {
        this.name.value = '';
        this.surname.value = '';
        this.mail.value = '';
    }

    updateOrDelete(e) {
        const clickedArea = e.target;


        if (clickedArea.classList.contains('btn--delete')) {
            this.selectedRow = clickedArea.parentElement.parentElement;
            this.removePersonOnScreen();

        } else if (clickedArea.classList.contains('btn--edit')) {
            this.selectedRow = clickedArea.parentElement.parentElement;
            this.addUpdateButton.value = 'Update';
            this.name.value = this.selectedRow.cells[0].textContent;
            this.surname.value = this.selectedRow.cells[1].textContent;
            this.mail.value = this.selectedRow.cells[2].textContent;

        }

    }

    updatePersonOnScreen(pers) {


        const result = this.db.updatePerson(pers, this.selectedRow.cells[2].textContent);
        if (result) {
            this.selectedRow.cells[0].textContent = pers.name;
            this.selectedRow.cells[1].textContent = pers.surname;
            this.selectedRow.cells[2].textContent = pers.mail;


            this.clearAreas();
            this.selectedRow = undefined;
            this.addUpdateButton.value = 'Save';
            this.infoCreate('Person Updated', true);

        } else {
            this.infoCreate('This Email has already been taken.', false);
        }




    }

    removePersonOnScreen() {
        this.selectedRow.remove();
        const deletedMail = this.selectedRow.cells[2].textContent;

        this.db.removePerson(deletedMail);
        this.clearAreas();
        this.selectedRow = undefined;
        this.infoCreate('Person Removed', true);
    }

    printPersonsOnScreeen() {
        this.db.allPersons.forEach(pers => {
            this.addPersonOnScreen(pers);
        });
    }

    addPersonOnScreen(person) {
        const createdTR = document.createElement('tr');
        createdTR.innerHTML = `<td>${person.name}</td>
        <td>${person.surname}</td>
        <td>${person.mail}</td>
        <td>
            <button class="btn btn--edit"><i class="far fa-edit"></i></button>
            <button class="btn btn--delete"><i class="far fa-trash-alt"></i></button>  
        </td>`;

        this.personList.appendChild(createdTR);

    }

}

class LocalStorage {
    //uygulama ilk açıldıgında veriler getirilir.

    constructor() {
        this.allPersons = this.fetchPersons();
    }

    isEmailUnique(mail) {
        const result = this.allPersons.find(pers => {
            return pers.mail === mail;
        });

        //demekki bu maili kulalnan biri var
        if (result) {
            console.log(mail + " has already been used.");
            return false;
        } else {
            console.log(mail + " is unique which can be used.");
            return true;
        }
    }
    fetchPersons() {
        let allPersonsLocal;
        if (localStorage.getItem('Persons') === null) {
            allPersonsLocal = [];
        } else {
            allPersonsLocal = JSON.parse(localStorage.getItem('Persons'));
        }
        return allPersonsLocal;
    }
    addPerson(pers) {

        if (this.isEmailUnique(pers.mail)) {
            this.allPersons.push(pers);
            localStorage.setItem('Persons', JSON.stringify(this.allPersons));
            return true;
        } else {
            return false;
        }

    }
    removePerson(mail) {
        this.allPersons.forEach((pers, index) => {
            if (pers.mail === mail) {
                this.allPersons.splice(index, 1);
            }
        });
        localStorage.setItem('Persons', JSON.stringify(this.allPersons));
    }

    //guncellenmisKisi : yeni değerleri içerir
    //mail kişinin veritabanında bulunması için gerekli olan eski mailini içerir.
    updatePerson(updatedPerson, mail) {

        if (updatedPerson.mail === mail) {
            this.allPersons.forEach((kisi, index) => {
                if (kisi.mail === mail) {
                    console.log("Person Found in Loop.");
                    this.allPersons[index] = updatedPerson;
                    localStorage.setItem('Persons', JSON.stringify(this.allPersons));
                    return true;
                }
            });

            return true;
        }

        if (this.isEmailUnique(updatedPerson.mail)) {
            console.log(updatedPerson.mail + " controlling and result: able to update ");

            this.allPersons.forEach((pers, index) => {
                if (pers.mail === mail) {
                    console.log("person found in loop");
                    this.allPersons[index] = updatedPerson;
                    localStorage.setItem('Persons', JSON.stringify(this.allPersons));
                    return true;
                }
            });

            return true;




        } else {
            console.log(updatedPerson.mail + " is on usage so cannot be updated.");
            return false;
        }



    }

}

document.addEventListener('DOMContentLoaded', function(e) {
    const screen = new Screen();
});