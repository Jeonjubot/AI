let chatData = [], currentNode = null;
const currentCode = "000000";
let previousHeight = window.innerHeight;
let userAnswers = [];
let userRating = 0;
let currentAudio = null;
let isAudioEnabled = false; // 음성 재생 여부
const RATING_AUDIO = "평가안내.mp3";

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  }[tag]));
}

function showMessage(text, isUser = false, scroll = true) {
  const chat = document.getElementById("chatWindow");
  const msgWrapper = document.createElement("div");
  msgWrapper.className = "message " + (isUser ? "user" : "bot");

  const isHTML = /<img |<video |<source /.test(text);
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = isHTML ? text : escapeHTML(text).replace(/\n/g, "<br>");

  if (!isUser) {
    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = "./이미지/profile.png";

    const content = document.createElement("div");
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = "KT MOS 남부";

    content.appendChild(name);
    content.appendChild(bubble);
    msgWrapper.appendChild(avatar);
    msgWrapper.appendChild(content);
  } else {
    msgWrapper.appendChild(bubble);
  }

  chat.appendChild(msgWrapper);
  if (scroll) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
      }, 0);
    });
  }
}

async function playAudio(audioFile) {
  if (!isAudioEnabled) return;
  const audioPath = `./오디오/${audioFile}`;
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentAudio = new Audio(audioPath);
    await currentAudio.play();
  } catch (err) {
    console.warn("오디오 재생 오류:", err.message);
  }
}

function showOptions(options) {
  const chat = document.getElementById("chatWindow");
  const optionWrapper = document.createElement("div");
  optionWrapper.className = "message bot";
  optionWrapper.style.width = "100%";

  const btnGroup = document.createElement("div");
  btnGroup.style.display = "flex";
  btnGroup.style.flexDirection = "column";
  btnGroup.style.alignItems = "center";
  btnGroup.style.gap = "12px";
  btnGroup.style.marginTop = "8px";
  btnGroup.style.width = "100%";

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <span style="flex: 0 0 30px; text-align: left;">${opt.번호}.</span>
        <span style="flex: 1; text-align: center;">${opt.내용}</span>
        <span style="flex: 0 0 30px;"></span>
      </div>
    `;
    Object.assign(btn.style, {
      padding: "16px 18px",
      fontSize: "24px",
      border: "none",
      borderRadius: "24px",
      background: "#fbeec0",
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      width: "100%",
      maxWidth: "360px",
      margin: "0 auto"
    });

    btn.onclick = () => {
  if (btn.disabled) return;
  btn.disabled = true;

  btn.parentElement.querySelectorAll("button").forEach(b => {
    b.disabled = true;
    b.style.background = "#ccc";
    b.style.color = "#888";
    b.style.cursor = "not-allowed";
  });

  document.getElementById("input").value = opt.번호;
  handleSend();
};

    btnGroup.appendChild(btn);
  });

  optionWrapper.appendChild(btnGroup);
  chat.appendChild(optionWrapper);
  requestAnimationFrame(() => {
    optionWrapper.scrollIntoView({ behavior: "smooth", block: "end" });
  });
}

async function showImageFirst(imageName) {
  const imagePath = `./이미지/${imageName}.png`;
  try {
    const res = await fetch(imagePath);
    if (res.ok) {
      showMessage(
        `<img src="${imagePath}" style="max-width:100%; border-radius:12px; cursor:pointer;" onclick="openModal('${imagePath}')">`,
        false, true
      );
      return true;
    }
  } catch {}
  return false;
}

async function showVideoFirst(videoName) {
  const videoPath = `./영상/${videoName}.mp4`;
  try {
    const res = await fetch(videoPath);
    if (res.ok) {
      showMessage(
        `<video controls style="max-width:100%; border-radius:12px;">
          <source src="${videoPath}" type="video/mp4">
          이 브라우저는 video 태그를 지원하지 않습니다.
        </video>`,
        false, true
      );
      return true;
    }
  } catch {}
  return false;
}

async function showQuestion(id) {
  currentNode = chatData.find(d => d.ID === id);
  if (!currentNode) return;

  if (currentNode.이미지) {
    await showImageFirst(currentNode.이미지);
    await new Promise(r => setTimeout(r, 400));
  }

  if (currentNode.영상) {
    await showVideoFirst(currentNode.영상);
    await new Promise(r => setTimeout(r, 400));
  }

  showMessage(currentNode.질문내용);

  if (currentNode.선택지?.length) {
    showOptions(currentNode.선택지);
    setTimeout(() => {
      if (currentNode.오디오) playAudio(currentNode.오디오);
    }, 200);
  } else {
    if (currentNode.오디오) {
      setTimeout(() => playAudio(currentNode.오디오), 400);
    }
  }
}

async function handleSend() {
  const input = document.getElementById("input");
  const val = input.value.trim();
  if (!val) return;

  showMessage(val, true);
  userAnswers.push(`${currentNode?.ID}:${val}`);
  input.value = "";

  const number = parseInt(val, 10);
  const isImageTarget = isNaN(number) || number > 20;
  let imageShown = false;

  if (isImageTarget) {
    const imagePath = `./이미지/${val}.png`;
    try {
      const res = await fetch(imagePath);
      if (res.ok) {
        showMessage(`<img src="${imagePath}" style="max-width:100%; border-radius:12px;">`);
        imageShown = true;
      }
    } catch {}
  }

  if (!currentNode) return;

  const next = currentNode.선택지.find(opt => opt.번호 === val);
  if (next) {
    if (["END", "END1", "END2", "예비1", "예비2", "예비3"].includes(next.다음ID)) {
      showRating();
    } else {
      showQuestion(next.다음ID);
    }
  } else if (!imageShown) {
    showMessage("올바른 번호를 입력해주세요.");
  }
}

function showRating() {
  const chat = document.getElementById("chatWindow");
  const wrapper = document.createElement("div");
  wrapper.className = "message bot";
  wrapper.style.display = "flex";
  wrapper.style.justifyContent = "center";

  const box = document.createElement("div");
  Object.assign(box.style, {
    background: "#fff",
    borderRadius: "24px",
    padding: "20px",
    marginTop: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    textAlign: "center"
  });

  const title = document.createElement("div");
  title.innerHTML = "서비스는 얼마나 만족스러우셨나요?";
  title.style.marginBottom = "12px";
  title.style.fontSize = "17px";

  const starContainer = document.createElement("div");
  starContainer.id = "starContainer";
  Object.assign(starContainer.style, {
    display: "flex", justifyContent: "center",
    gap: "6px", marginBottom: "16px"
  });

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("img");
    star.src = "./이미지/star-empty.png";
    star.id = `star-${i}`;
    star.style.width = "40px";
    star.style.cursor = "pointer";
    star.onclick = () => selectStar(i);
    starContainer.appendChild(star);
  }

  const note = document.createElement("div");
  note.innerHTML = "※ 별점을 선택하신 후 <strong>확인</strong> 버튼을 눌러주세요.";
  note.style.fontSize = "14px";
  note.style.color = "#555";
  note.style.marginBottom = "16px";

  const button = document.createElement("button");
  button.textContent = "확인";
  button.onclick = submitRating;
  Object.assign(button.style, {
    padding: "10px 20px", fontSize: "16px",
    border: "none", borderRadius: "8px",
    background: "#007bff", color: "white", cursor: "pointer"
  });

  [title, starContainer, note, button].forEach(el => box.appendChild(el));
  wrapper.appendChild(box);
  chat.appendChild(wrapper);

  if (isAudioEnabled) {
    playAudio(RATING_AUDIO);
  }

  setTimeout(() => wrapper.scrollIntoView({ behavior: "smooth" }), 400);
}

function selectStar(n) {
  userRating = n;
  for (let i = 1; i <= 5; i++) {
    document.getElementById(`star-${i}`).src =
      i <= n ? "./이미지/star-filled.png" : "./이미지/star-empty.png";
  }
}

async function submitRating() {
  if (userRating === 0) return alert("별점을 선택해주세요!");

  const formData = new FormData();
  formData.append("entry.2117231632", userAnswers.join(", "));
  formData.append("entry.1295290961", userRating);

  try {
    await fetch("https://docs.google.com/forms/d/e/1FAIpQLSf9DGvbm4TeyJ4aKVg49DmgyRr7kb4MNp705fTmxN7d_V-XwQ/formResponse", {
      method: "POST",
      mode: "no-cors",
      body: formData
    });
   showMessage("감사합니다!");

    const lastAnswer = userAnswers[userAnswers.length - 1];
const lastID = lastAnswer?.split(":")[0];
const lastChoice = lastAnswer?.split(":")[1];

const lastNode = chatData.find(d => d.ID === lastID);
const choice = lastNode?.선택지?.find(opt => opt.번호 === lastChoice);
const nextId = choice?.다음ID;

//END1 전화, END2 문자
if (nextId === "예비1") {
  window.location.href = `sms:01000000000?body=${encodeURIComponent("TEST1 관련 문의입니다.")}`;
} else if (nextId === "예비2") {
  window.location.href = `sms:01000000000?body=${encodeURIComponent("TEST2 관련 문의입니다.")}`;
} else if (nextId === "예비3") {
  window.location.href = `sms:01000000000?body=${encodeURIComponent("TEST3 관련 문의입니다.")}`;
} else if (nextId === "END2") {
  window.location.href = `sms:01000000000?body=${encodeURIComponent("기술TT 관련 문의드립니다.")}`;
} else if (nextId === "END1") {
  window.location.href = "tel:01000000000";
}

  } catch (err) {
    showMessage("⚠️ 오류 발생: " + err.message);
  }
}

  document.getElementById("input").addEventListener("keydown", e => {
    if (e.key === "Enter") handleSend();
  });

function showAudioButton() {
  const chat = document.getElementById("chatWindow");
  const wrapper = document.createElement("div");
  wrapper.className = "message bot audio-toggle";

  const btn = document.createElement("button");
  btn.textContent = "🎧 음성 안내 듣기";
  btn.onclick = () => {
    isAudioEnabled = true;
    btn.disabled = true;

    if (currentNode?.오디오) {
    playAudio(currentNode.오디오);
  }
};

  wrapper.appendChild(btn);
  chat.insertBefore(wrapper, chat.firstChild); 
}

(async () => {
  try {
    const res = await fetch(`./코드/${currentCode}.json`);
    if (!res.ok) throw new Error("지역코드 데이터 없음");
    chatData = await res.json();

    await new Promise(resolve => setTimeout(resolve, 300));
    showQuestion("Q1");    
    showAudioButton();     
  } catch {
    showMessage("❌ 코드 데이터가 존재하지 않습니다.");
  }
})();

window.addEventListener("resize", () => {
  const currentHeight = window.innerHeight;
  const chat = document.getElementById("chatWindow");
  if (currentHeight < previousHeight) {
    chat.scrollTop = chat.scrollHeight;
  }
  previousHeight = currentHeight;
});

function openModal(src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  modalImg.src = src;
  modal.style.display = "flex";
  modalImg.onload = () => {
    const zoom = modal.querySelector("pinch-zoom");
    if (zoom?.reset) zoom.reset();
  };
}

function closeModal() {
  document.getElementById("imageModal").style.display = "none";
}
