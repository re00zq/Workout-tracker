'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
  getTitle() {
    this.title = `${this.name[0].toUpperCase() + this.name.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    return this.title;
  }
}

class Running extends Workout {
  name = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this.getTitle();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  name = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.getTitle();
  }
  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

class App {
  #map;
  #mapE;
  #mapZoomLevel = 13;
  #workout = [];
  workout;
  constructor() {
    this._getPosition();
    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._goToView.bind(this));
    this._getLocalStorage();
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("couldn't get your location");
        }
      );
    }
  }
  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    //console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];

    //console.log(position);
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workout.forEach(work => {
      this._showMarker(work);
    });
  }
  _showForm(mapEvent) {
    form.classList.remove('hidden');
    inputDistance.focus();
    this.#mapE = mapEvent;
  }
  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _showMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 50,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.name}-popup`,
        })
      )
      .setPopupContent(
        `${workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.title}`
      )
      .openPopup();
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();

    function allNumber(...inptuts) {
      return inptuts.every(input => Number.isFinite(input));
    }

    function allPositive(...inptuts) {
      return inptuts.every(input => input > 0);
    }

    // Get inputs from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elevation = +inputElevation.value;
    let { lat, lng } = this.#mapE.latlng;
    // if type is running
    if (type === 'running') {
      if (
        !allNumber(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Enter valid input');
      this.workout = new Running(distance, duration, [lat, lng], cadence);
    }
    if (type === 'cycling') {
      if (
        !allNumber(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Enter valid input');
      this.workout = new Cycling(distance, duration, [lat, lng], elevation);
    }
    this.#workout.push(this.workout);
    this._hideForm();
    this._showMarker(this.workout);
    this._renderWorkout(this.workout);
    // console.log(this.#workout);
    this._setLocalStorage();
  }
  _renderWorkout(workout) {
    const html = `        
                <li class="workout workout--${workout.name}" data-id="${
      workout.id
    }">
                  <h2 class="workout__title">${workout.title}</h2>
                  <div class="workout__details">
                    <span class="workout__icon">${
                      workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'
                    }</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                  </div>
                  <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                  </div>
                  <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${
                      workout.name === 'running'
                        ? workout.pace.toFixed(1)
                        : workout.speed.toFixed(1)
                    }</span>
                    <span class="workout__unit">${
                      workout.name === 'running' ? 'h/km' : 'km/h'
                    }</span>
                  </div>
                  <div class="workout__details">
                    <span class="workout__icon">${
                      workout.name === 'running' ? '🦶🏼' : '⛰'
                    }</span>
                    <span class="workout__value">${
                      workout.name === 'running'
                        ? workout.cadence
                        : workout.elevationGain
                    }</span>
                    <span class="workout__unit">${
                      workout.name === 'running' ? 'spm' : 'm'
                    }</span>
                  </div>
                </li>
                `;
    form.insertAdjacentHTML('afterend', html);
  }
  _goToView(e) {
    if (!this.#map) return;
    const targetE = e.target.closest('.workout');
    if (!targetE) return;
    const target = this.#workout.find(
      target => targetE.dataset.id === target.id
    );
    console.log(targetE);
    this.#map.setView(target.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workout = data;

    this.#workout.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
