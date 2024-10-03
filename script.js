import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  addDoc // Adicione esta linha
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7iRsqwMEgxTNXhYRfV6cVWZ3F8uk1lf4",
  authDomain: "calendario-marketing.firebaseapp.com",
  projectId: "calendario-marketing",
  storageBucket: "calendario-marketing.appspot.com",
  messagingSenderId: "82794610763",
  appId: "1:82794610763:web:0aa3dced713784d040cdce",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async () => {
  const sidebarItems = document.querySelectorAll(".sidebar ul li");
  const mainContent = document.getElementById("main-content");
  let events = loadEvents(); // Carrega eventos do localStorage
  let trainings = loadTrainings(); // Carrega treinamentos do localStorage
  let currentEventDate = ""; // Data do evento atual
  let currentEventIndex = null; // Índice do evento atual
  let selectedMonth = new Date().getMonth(); // Mês atual
  let selectedYear = new Date().getFullYear(); // Ano atual
  const modais = document.querySelectorAll('.modal');


     // Função para fechar um modal
     function fecharModal(modal) {
      modal.style.display = "none";
    }

    // Adiciona o evento de clique nos ícones de fechar
modais.forEach(modal => {
  const closeBtn = modal.querySelector('.close');
  
  // Fecha o modal ao clicar no ícone de fechar
  closeBtn.addEventListener('click', () => {
      fecharModal(modal);
  });
  
  // Fecha o modal ao clicar fora da modal-content
  modal.addEventListener('click', (event) => {
      if (event.target === modal) {
          fecharModal(modal);
      }
  });
});
  
  // Função para trocar o conteúdo da seção principal
  function switchSection(sectionContent) {
    mainContent.innerHTML = sectionContent;
  }

  function generateCalendar() {
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
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
                  `<option value="${index}" ${
                    index === selectedMonth ? "selected" : ""
                  }>${name}</option>`
              )
              .join("")}</select>
            <label for="yearSelect">Ano:</label>
            <select id="yearSelect">${Array.from(
              { length: 10 },
              (_, i) =>
                `<option value="${2024 + i}" ${
                  2024 + i === selectedYear ? "selected" : ""
                }>${2024 + i}</option>`
            ).join("")}</select>
        </div>
        <div class="calendar">`;

    for (let i = 0; i < firstDay; i++) {
      calendarHTML += `<div class="calendar-day empty"></div>`;
    }

    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${selectedYear}-${String(selectedMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const isToday =
        today.getDate() === day &&
        selectedMonth === today.getMonth() &&
        selectedYear === today.getFullYear();
      const dayClass = isToday ? "calendar-day today" : "calendar-day";

      const eventList = events[date] || [];
      const trainingList = trainings.filter(
        (training) => training.date === date
      );

      const allEvents = [
        ...eventList.map((event) => `<div class="event normal">${event}</div>`),
        ...trainingList.map(
          (training) =>
            `<div class="event training">Treinamento ${training.supplier} às ${training.time}</div>`
        ),
      ];

      calendarHTML += `<div class="${dayClass}" data-date="${date}">${day}
            <div class="events-container">${allEvents.join("")}</div>
        </div>`;
    }

    calendarHTML += `</div>`;
    return calendarHTML;
  }

  async function refreshCalendar() {
    events = await loadEvents(); // Garante que os eventos sejam carregados antes de atualizar
    trainings = await loadTrainings(); // Garante que os treinamentos sejam carregados antes de atualizar
    switchSection(generateCalendar());
    document.querySelectorAll(".calendar-day").forEach((day) => {
      day.addEventListener("click", handleDayClick);
    });
  }

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

    // Função para adicionar um evento via modal e salvar no Firestore
    saveEventBtn.onclick = () => {
      const newEvent = `${document.getElementById("eventText").value} at ${
        document.getElementById("eventTime").value
      }`;
      if (newEvent) {
        if (!events[currentEventDate]) {
          events[currentEventDate] = [];
        }
        events[currentEventDate].push(newEvent); // Adiciona ao localStorage

        saveEvents(); // Salva no Firestore e localStorage
        refreshCalendar();
      }
      modal.style.display = "none";
    };

     

    document.getElementById("updateEventBtn").onclick = () => {
      const updatedEvent = `${editEventTextInput.value} at ${editEventTimeInput.value}`;
      if (currentEventIndex !== null && events[currentEventDate]) {
        events[currentEventDate][currentEventIndex] = updatedEvent;
        saveEvents();
        refreshCalendar();
      }
      editModal.style.display = "none";
    };

    // Função para remover eventos do Firestore e localStorage
    document.getElementById("deleteEventBtn").onclick = async () => {
      if (currentEventIndex !== null && events[currentEventDate]) {
        const deletedEvent = events[currentEventDate][currentEventIndex]; // Evento a ser deletado
        events[currentEventDate].splice(currentEventIndex, 1);
        if (events[currentEventDate].length === 0) {
          delete events[currentEventDate];
        }
        saveEvents(); // Atualiza o localStorage e o Firestore

        try {
          // Remover do Firestore
          const eventsSnapshot = await getDocs(collection(db, "events"));
          eventsSnapshot.forEach(async (doc) => {
            const eventData = doc.data();
            if (
              eventData.date === currentEventDate &&
              eventData.events.includes(deletedEvent)
            ) {
              const updatedEvents = eventData.events.filter(
                (event) => event !== deletedEvent
              );

              if (updatedEvents.length === 0) {
                await deleteDoc(doc.ref);
              } else {
                await updateDoc(doc.ref, { events: updatedEvents });
              }
              console.log("Evento removido do Firestore.");
            }
          });
        } catch (error) {
          console.error("Erro ao remover evento do Firestore: ", error);
        }

        refreshCalendar();
      }
      editModal.style.display = "none";
    };

    // Inicializa o calendário e carrega eventos do Firestore e localStorage
    document.addEventListener("DOMContentLoaded", async () => {
      events = await loadEvents(); // Carrega eventos do Firestore e localStorage
      refreshCalendar();
    });
  }

  function showTrainings() {
    const trainingHTML = trainings
      .map((training, index) => {
        return `
        <div class="training-item">
          <img src="${training.photo}" alt="Foto do Treinamento">
          <p><strong>Fornecedor:</strong> ${training.supplier}</p>
          <p><strong>Assunto:</strong> ${training.subject}</p>
          <p><strong>Data:</strong> ${training.date}</p>
          <p><strong>Hora:</strong> ${training.time}</p>
          <button class="delete-training" data-index="${index}">Excluir</button>
        </div>`;
      })
      .join("");

    switchSection(`
      <h2>Treinamentos</h2>
      <button id="addTrainingBtn">Adicionar Treinamento</button>
      <div class="trainings">${trainingHTML}</div>
    `);

    document.getElementById("addTrainingBtn").onclick = () => {
      document.getElementById("createTrainingModal").style.display = "block";
    };

    document.querySelectorAll(".delete-training").forEach((button) => {
      button.onclick = (e) => {
        const index = e.target.dataset.index;
        deleteTraining(index);
      };
    });
  }

  // Função para excluir o treinamento
  function deleteTraining(index) {
    trainings.splice(index, 1); // Remove o item pelo índice
    saveTrainings(); // Salva as mudanças no localStorage
    showTrainings(); // Atualiza a lista de treinamentos
  }

  // Salva ou atualiza eventos no Firestore e localStorage
  async function saveEvents() {
    try {
      const eventList = events[currentEventDate] || [];

      // Salva no Firestore usando a data como ID do documento
      const docRef = doc(db, "events", currentEventDate);
      await setDoc(docRef, {
        date: currentEventDate,
        events: eventList,
      });

      // Atualiza o localStorage também
      localStorage.setItem("events", JSON.stringify(events));
      console.log("Evento salvo ou atualizado no Firestore e localStorage.");
    } catch (error) {
      console.error("Erro ao salvar evento no Firestore: ", error);
    }
  }

  async function loadEvents() {
    let events = JSON.parse(localStorage.getItem("events")) || {};
    console.log("Eventos do localStorage:", events);
  
    try {
      const eventsSnapshot = await getDocs(collection(db, "events"));
      eventsSnapshot.forEach((doc) => {
        events[doc.id] = doc.data().events;
      });
      console.log("Eventos carregados do Firestore:", events);
  
      localStorage.setItem("events", JSON.stringify(events));
    } catch (error) {
      console.error("Erro ao carregar eventos do Firestore: ", error);
    }
  
    return events;
  }
  

  async function loadTrainings() {
    const storedTrainings = localStorage.getItem("trainings");
    let trainings = storedTrainings ? JSON.parse(storedTrainings) : [];

    // Carrega do Firestore
    try {
      const trainingsSnapshot = await getDocs(collection(db, "trainings"));
      trainingsSnapshot.forEach((doc) => {
        trainings.push(doc.data());
      });
      console.log("Treinamentos carregados do Firestore.");
    } catch (error) {
      console.error("Erro ao carregar treinamentos do Firestore: ", error);
    }

    return trainings;
  }

  // Salva treinamentos no localStorage
  async function saveTrainings() {
    // Salva no localStorage
    localStorage.setItem("trainings", JSON.stringify(trainings));

    // Salva no Firestore
    try {
      const trainingsRef = collection(db, "trainings");
      for (const training of trainings) {
        await addDoc(trainingsRef, {
          photo: training.photo,
          supplier: training.supplier,
          subject: training.subject,
          date: training.date,
          time: training.time,
        });
      }
      console.log("Treinamentos salvos no Firestore.");
    } catch (error) {
      console.error("Erro ao salvar treinamentos no Firestore: ", error);
    }
  }

  // Carrega treinamentos do localStorage
  function loadTrainings() {
    const storedTrainings = localStorage.getItem("trainings");
    return storedTrainings ? JSON.parse(storedTrainings) : [];
  }

  sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      sidebarItems.forEach((li) => li.classList.remove("active"));
      item.classList.add("active");
      if (item.dataset.section === "calendar") {
        refreshCalendar();
      } else if (item.dataset.section === "trainings") {
        showTrainings();
      }
    });
  });

  document.querySelectorAll(".close").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".modal").style.display = "none";
    });
  });

  refreshCalendar();

  // Criação de Treinamento
  document.getElementById("createTrainingBtn").onclick = () => {
    const trainingPhoto = URL.createObjectURL(
      document.getElementById("trainingPhoto").files[0]
    );
    const trainingSupplier = document.getElementById("trainingSupplier").value;
    const trainingSubject = document.getElementById("trainingSubject").value;
    const trainingDate = document.getElementById("trainingDate").value;
    const trainingTime = document.getElementById("trainingTime").value;

    trainings.push({
      photo: trainingPhoto,
      supplier: trainingSupplier,
      subject: trainingSubject,
      date: trainingDate,
      time: trainingTime,
    });

    saveTrainings();
    showTrainings();
    document.getElementById("createTrainingModal").style.display = "none";
  };

  // Seleciona mês e ano no calendário
  document.addEventListener("change", (event) => {
    if (event.target.id === "monthSelect") {
      selectedMonth = Number(event.target.value);
      refreshCalendar();
    } else if (event.target.id === "yearSelect") {
      selectedYear = Number(event.target.value);
      refreshCalendar();
    }
  });
});
