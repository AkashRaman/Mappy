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
const logo = document.querySelector('.logo');

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

  setDescription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    return this.description;
  }

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    super.setDescription();
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    super.setDescription();
    this.elevation = elevation;
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
  #mapZoomLevel = 13;
  #workouts = [];
  #workoutMarkers = [];
  #currentPosition;
  constructor() {
    this._getPostion();

    inputType.addEventListener('change', this._toggleElevationFeild);

    form.addEventListener('submit', this._newWorkout.bind(this));

    containerWorkouts.addEventListener('click', this._clickedWorkout.bind(this));
    logo.addEventListener('click', () => this.#map.setView(this.#currentPosition, this.#map.getZoom(), {
        animation: true,
        pan: {
          duration: 1,
        },})
    );
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
    this.#currentPosition = [latitude, longitude];

    this.#map = L.map('map').setView(this.#currentPosition, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(this.#currentPosition, { icon: mappyIcon })
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

    this._getLocalStorage();
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
    inputDistance.focus();
  }

  _newWorkout(e) {
    e.preventDefault();
    
    
    const validInputs = (...inputs) =>
    inputs.every(inp => Number.isFinite(inp));
    
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
   
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    if (inputDistance === document.activeElement){
      inputDuration.focus();
      return ;
    }

    if (inputDuration === document.activeElement){
      type === 'running' ? inputCadence.focus() : inputElevation.focus(); 
      return ;
    }
    let workout;
    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Enter proper values for respected feilds');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Enter proper values for respected feilds');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);

    this._renderWorkoutMap(workout);

    this._renderWorkoutList(workout);

    this._hideAndClearForm();

    this._setLocalStorage();
  }
  _renderWorkoutMap(workout) {
    this.#workoutMarkers.push(L.marker(workout.coords, { icon: mappyIcon })
    .addTo(this.#map)
    .bindPopup(
      L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${ workout.type === 'running' ? `🏃‍♂️` : `🚴‍♀️` } ${ workout.description}`
        )
      .openPopup());
    }
    
    _renderWorkoutList(workout) {
      const html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <a class="removeWorkout-button" href="#close">×</a>
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ? `🏃‍♂️` : `🚴‍♀️`}</span>
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
          <span class="workout__value">${workout.type === 'running' ? workout.pace.toFixed(1) : workout.speed.toFixed(1)}</span>
          <span class="workout__unit">${
            workout.type === 'running' ? `min/km` : `km/h`
          }</span>
          </div>
          <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? `🦶🏼` : `⛰`
          }</span>
          <span class="workout__value">${
            workout.type === 'running' ? workout.cadence : workout.elevation
          }</span>
          <span class="workout__unit">${
            workout.type === 'running' ? `spm` : `m`
          }</span>
          </div>
          </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _hideAndClearForm() {
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _clickedWorkout(e){
    const workoutEl = e.target.closest('.workout');

    const close = e.target.closest('.removeWorkout-button');

    const formClose = e.target.closest('.hide-button');
    
    if (formClose) {
      this._hideForm();
      return ;
    }
    
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
      );

    if(close){
      this._removeWorkout(workout,workoutEl);
      return ;
    } 
    this._moveToPopup(workout);  
  }

  _hideForm(){
    form.classList.add('hidden');
  }
  _moveToPopup(workout) {  
    this.#map.setView(workout.coords, this.#map.getZoom(), {
      Animation: true,
      pan: {
        duration: 1,
      },
    });
  }
  

  _setLocalStorage(){
    localStorage.setItem('workouts', JSON.stringify(this.#workouts))
  }

  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'));
    
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkoutList(work);
      this._renderWorkoutMap(work);
    })
  }

  _removeWorkout(workout,div){
    const index = this.#workouts.findIndex(work => work === workout);
    this.#workouts.splice(index,1);
    
    div.parentElement.removeChild(div);
    
    const arraysMatch = function (arr1, arr2) {

      // Check if the arrays are the same length
      if (arr1.length !== arr2.length) return false;
    
      // Check if all items exist and are in the same order
      for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
      }
    
      // Otherwise, return true
      return true;
    
    };
    const marker = this.#workoutMarkers.find(function(mark) {
      const {lat, lng} = mark._latlng;
      const coord = [lat,lng];
      
      return arraysMatch(workout.coords,coord);
    })

    this.#map.removeLayer(marker);
    
    //Removing the workout element from the localStorage
    localStorage.removeItem('workouts');
    localStorage.setItem('workouts', JSON.stringify(this.#workouts))

  }

  
}

const app = new App();
