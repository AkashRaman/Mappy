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

const mappyIcon = L.icon({
  iconUrl: 'icon.png',
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -40],
  shadowUrl: 'marker-shadow.png',
  shadowSize: [50, 50],
  shadowAnchor: [20, 50],
});

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  coords;
  distance;
  duration;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workout {
  cadence;
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  elevation;

  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.cadence = elevation;
    this.calcSpped();
  }

  calcSpped() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workout = [];
  constructor() {
    this._getPostion();

    inputType.addEventListener('change', this._toggleElevationFeild);

    form.addEventListener('submit', this._newWorkout.bind(this));
  }

  _getPostion() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords, { icon: mappyIcon })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
        })
      )
      .setPopupContent('Current Location')
      .openPopup();
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationFeild() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if(!validInputs(distance,duration,cadence)||!allPositive(distance,duration,cadence)) return alert("Enter positive input");
      workout = new Running([lat, lng],distance,duration,cadence);
    }
    
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if(!validInputs(distance,duration,elevation)||!allPositive(distance,duration)) return alert("Enter positive input");
      workout = new Cycling([lat, lng],distance,duration,elevation);
    }

    this.#workout.push(workout);
    console.log(workout);

    this._renderWorkoutMap(workout,type)
    
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    form.classList.add('hidden');
  }

  _renderWorkoutMap(workout,type){
    L.marker(workout.coords, { icon: mappyIcon })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${type}-popup`,
        })
      )
      .setPopupContent(`Running on ${Date.months}`)
      .openPopup();

  }
}

const app = new App();
