document.addEventListener("DOMContentLoaded", () => {
    const sidebarItems = document.querySelectorAll(".sidebar ul li");
    const mainContent = document.getElementById("main-content");
    let events = loadEvents(); // Carrega eventos do localStorage
    let trainings = loadTrainings(); // Carrega treinamentos do localStorage
    let currentEventDate = ""; // Data do evento atual
    let currentEventIndex = null; // Índice do evento atual
    let selectedMonth = new Date().getMonth(); // Mês atual
    let selectedYear = new Date().getFullYear(); // Ano atual
  
    // Função para trocar o conteúdo da seção principal
    function switchSection(sectionContent) {
      mainContent.innerHTML = sectionContent;
    }
  
    function generateCalendar() {
      const monthNames = [
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
  
      const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  
      let calendarHTML = `
          <h2>${monthNames[selectedMonth]} ${selectedYear}</h2>
          <div>
              <label for="monthSelect">Mês:</label>
              <select id="monthSelect">${monthNames
                  .map(
                      (name, index) =>
                          `<option value="${index}" ${index === selectedMonth ? "selected" : ""}>${name}</option>`
                  )
                  .join("")}</select>
              <label for="yearSelect">Ano:</label>
              <select id="yearSelect">${Array.from(
                  { length: 10 },
                  (_, i) =>
                      `<option value="${2024 + i}" ${2024 + i === selectedYear ? "selected" : ""}>${2024 + i}</option>`
              ).join("")}</select>
          </div>
          <div class="calendar">`;
  
      for (let i = 0; i < firstDay; i++) {
          calendarHTML += `<div class="calendar-day empty"></div>`;
      }
  
      const today = new Date();
  
      for (let day = 1; day <= daysInMonth; day++) {
          const date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday =
              today.getDate() === day &&
              selectedMonth === today.getMonth() &&
              selectedYear === today.getFullYear();
          const dayClass = isToday ? "calendar-day today" : "calendar-day";
  
          const eventList = events[date] || [];
          const trainingList = trainings.filter(training => training.date === date);
  
          const allEvents = [
              ...eventList.map(event => `<div class="event normal">${event}</div>`),
              ...trainingList.map(training => `<div class="event training">Treinamento ${training.supplier} às ${training.time}</div>`)
          ];
  
          calendarHTML += `<div class="${dayClass}" data-date="${date}">${day}
              <div class="events-container">${allEvents.join("")}</div>
          </div>`;
      }
  
      calendarHTML += `</div>`;
      return calendarHTML;
  }
  
  

    // Função para atualizar a exibição dos treinamentos
function refreshTrainings() {
  showTrainings(); // Recarrega a seção de treinamentos
}
  
    // Função para lidar com o clique em um dia do calendário
    function handleDayClick() {
      const date = this.getAttribute("data-date");
      const modal = document.getElementById("eventModal");
      const editModal = document.getElementById("editEventModal");
      const saveEventBtn = document.getElementById("saveEventBtn");
      const editEventTextInput = document.getElementById("editEventText");
      const editEventTimeInput = document.getElementById("editEventTime");
      const eventList = events[date] || [];
      currentEventDate = date;
  
      if (eventList.length > 0) {
        editModal.style.display = "block";
        currentEventIndex = 0; // Apenas para edição do primeiro evento como exemplo
        const [eventText, eventTime] = eventList[currentEventIndex].split(" at ");
        editEventTextInput.value = eventText;
        editEventTimeInput.value = eventTime || "";
      } else {
        modal.style.display = "block";
      }
  
      // Salva o novo evento
      saveEventBtn.onclick = () => {
        const newEvent = `${document.getElementById("eventText").value} at ${
          document.getElementById("eventTime").value
        }`;
        if (newEvent) {
          if (!events[currentEventDate]) {
            events[currentEventDate] = [];
          }
          events[currentEventDate].push(newEvent);
          saveEvents(); // Salva eventos no localStorage
          refreshCalendar();
        }
        modal.style.display = "none";
      };
  
      // Atualiza o evento existente
      document.getElementById("updateEventBtn").onclick = () => {
        const updatedEvent = `${editEventTextInput.value} at ${editEventTimeInput.value}`;
        if (currentEventIndex !== null && events[currentEventDate]) {
          events[currentEventDate][currentEventIndex] = updatedEvent;
          saveEvents(); // Salva eventos no localStorage
          refreshCalendar();
        }
        editModal.style.display = "none";
      };
  
      // Exclui o evento existente
      document.getElementById("deleteEventBtn").onclick = () => {
        if (currentEventIndex !== null && events[currentEventDate]) {
          events[currentEventDate].splice(currentEventIndex, 1); // Remove o evento pelo índice
          if (events[currentEventDate].length === 0) {
            delete events[currentEventDate]; // Remove a data se não houver eventos
          }
          saveEvents(); // Salva eventos no localStorage
          refreshCalendar();
        }
        editModal.style.display = "none";
      };
    }
  
    // Função para fechar modais
    const closeModal = (modal) => {
      modal.style.display = "none";
    };
  
    // Adiciona funcionalidade de fechamento aos botões
    const closeButtons = document.querySelectorAll(".close");
    closeButtons.forEach((button) => {
      button.onclick = () => {
        closeModal(button.closest(".modal"));
      };
    });

    
  
    // Adiciona evento de clique aos itens da sidebar
    sidebarItems.forEach((item) => {
      item.addEventListener("click", function () {
        sidebarItems.forEach((i) => i.classList.remove("active"));
        this.classList.add("active");
  
        const section = this.getAttribute("data-section");
        switch (section) {
          case "calendar":
            refreshCalendar();
            break;
          case "trainings":
            showTrainings();
            break;
          case "events":
            showEvents();
            break;
          case "weekly-tasks":
            showWeeklyTasks();
            break;
        }
      });
    });
  
    // Função para mostrar treinamentos
    function showTrainings() {
      const trainingSection = trainings
        .map(
          (training, index) => `
          <div class="card">
              <img src="${training.photo}" alt="Treinamento" />
              <h3>${training.supplier}</h3>
              <p>${training.subject}</p>
              <p>${training.date} às ${training.time}</p>
              <button class="deleteTrainingBtn" data-index="${index}">Excluir</button> <!-- Botão de exclusão -->
          </div>
        `
        )
        .join("");
  
      switchSection(`
          <h2>Treinamentos</h2>
          <button id="openCreateTrainingModal">Adicionar Treinamento</button>
          <div class="trainings">${trainingSection}</div>
      `);
  
      // Evento para abrir o modal de criação de treinamento
      document.getElementById("openCreateTrainingModal").onclick = () => {
        document.getElementById("createTrainingModal").style.display = "block";
      };
  
      document.getElementById("createTrainingBtn").onclick = () => {
        const trainingPhoto = document.getElementById("trainingPhoto").files[0];
        const trainingSupplier =
          document.getElementById("trainingSupplier").value;
        const trainingSubject = document.getElementById("trainingSubject").value;
        const trainingDate = document.getElementById("trainingDate").value;
        const trainingTime = document.getElementById("trainingTime").value;
  
        if (
          trainingPhoto &&
          trainingSupplier &&
          trainingSubject &&
          trainingDate &&
          trainingTime
        ) {
          const reader = new FileReader();
          reader.onload = function (event) {
            const newTraining = {
              photo: event.target.result,
              supplier: trainingSupplier,
              subject: trainingSubject,
              date: trainingDate,
              time: trainingTime,
            };
  
            trainings.push(newTraining);
            saveTrainings(); // Salva treinamentos no localStorage
            refreshTrainings();
          };
          reader.readAsDataURL(trainingPhoto);
        }
  
        document.getElementById("createTrainingModal").style.display = "none";
      };
  
      // Adiciona funcionalidade de exclusão aos botões
      document.querySelectorAll(".deleteTrainingBtn").forEach((button) => {
        button.onclick = () => {
          const index = button.getAttribute("data-index");
          trainings.splice(index, 1);
          saveTrainings(); // Salva treinamentos no localStorage
          refreshTrainings();
        };
      });
    }
  
    // Atualiza o calendário
    function refreshCalendar() {
      const calendarHTML = generateCalendar();
      switchSection(calendarHTML);
  
      // Adiciona eventos de clique aos dias do calendário
      const calendarDays = document.querySelectorAll(".calendar-day:not(.empty)");
      calendarDays.forEach((day) => {
        day.onclick = handleDayClick;
      });
  
      // Adiciona evento de mudança nos selects de mês e ano
      document.getElementById("monthSelect").onchange = function () {
        selectedMonth = parseInt(this.value);
        refreshCalendar(); // Atualiza o calendário
      };
  
      document.getElementById("yearSelect").onchange = function () {
        selectedYear = parseInt(this.value);
        refreshCalendar(); // Atualiza o calendário
      };
    }
  
    // Salva eventos no localStorage
    function saveEvents() {
      localStorage.setItem("events", JSON.stringify(events));
    }
  
    // Carrega eventos do localStorage
    function loadEvents() {
      return JSON.parse(localStorage.getItem("events")) || {};
    }
  
    // Salva treinamentos no localStorage
    function saveTrainings() {
      localStorage.setItem("trainings", JSON.stringify(trainings));
    }
  
    // Carrega treinamentos do localStorage
    function loadTrainings() {
      return JSON.parse(localStorage.getItem("trainings")) || [];
    }
  
    // Inicializa o calendário ao carregar a página
    refreshCalendar();
  });
  