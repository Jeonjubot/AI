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
  optionWrapper.className = "message bot option-wrapper"; // ← wrapper에 클래스 추가

  const btnGroup = document.createElement("div");
  btnGroup.className = "option-group"; // ← 버튼 그룹에 클래스 지정

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-button"; // ← 버튼 기본 클래스
    btn.innerHTML = `
      <div class="option-inner">
        <span class="option-left">${opt.번호}.</span>
        <span class="option-center">${opt.내용}</span>
        <span class="option-right"></span>
      </div>
    `;

    btn.onclick = () => {
      if (btn.disabled) return;
      btn.disabled = true;

      btn.parentElement.querySelectorAll("button").forEach(b => {
        b.disabled = true;
        b.classList.add("option-disabled"); // ← 비활성 클래스만 추가
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
    await new Promise(r => setTimeout(r, 600));
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
    if (["END", "END1", "END2", "고장1", "고장2", "철거1", "철거2", "설치1", "설치2", "디버그"].includes(next.다음ID)) {
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
  wrapper.className = "message bot rating-wrapper";  // 클래스만 추가

  const box = document.createElement("div");
  box.className = "rating-box";  // ← 스타일 클래스

  const title = document.createElement("div");
  title.className = "rating-title";
  title.innerHTML = "서비스는 얼마나 만족스러우셨나요?";

  const starContainer = document.createElement("div");
  starContainer.id = "starContainer";
  starContainer.className = "rating-stars";

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("img");
    star.src = "./이미지/star-empty.png";
    star.id = `star-${i}`;
    star.className = "rating-star";
    star.onclick = () => selectStar(i);
    starContainer.appendChild(star);
  }

  const note = document.createElement("div");
  note.className = "rating-note";
  note.innerHTML = "※ 별점을 선택하신 후 <strong>확인</strong> 버튼을 눌러주세요.";

  const button = document.createElement("button");
  button.className = "rating-submit-button";
  button.textContent = "확인";
  button.onclick = submitRating;

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

//END1 전화, END2 문자, 고장1 댁내형, 고장2 기가아토
if (nextId === "고장1") {
  window.location.href = `sms:01093698758?body=${encodeURIComponent("댁내형 중계기 고장 문의입니다.")}`;
} else if (nextId === "고장2") {
  window.location.href = `sms:01093698758?body=${encodeURIComponent("통화품질 불량으로 장비설치 필요\nKT 인터넷 사용\n기가아토 설치 가능")}`;
} else if (nextId === "설치1") {
  window.location.href = `sms:01093698758?body=${encodeURIComponent("통화품질 불량으로 장비설치 필요\nKT 인터넷 미사용\n댁내형 청공 동의\n댁내형 설치 가능")}`;
} else if (nextId === "설치2") {
  window.location.href = `sms:01093698758?body=${encodeURIComponent("기가아토 설치 문의입니다.")}`;
} else if (nextId === "철거1") {
  window.location.href = `sms:01093698758?body=${encodeURIComponent("철거\n기가아토 철거요청\n방문 철거요청")}`;
} else if (nextId === "철거2") {
  window.location.href = `sms:01093698758?body=${encodeURIComponent("철거\n기가아토 철거요청\n비대면 철거요청")}`;
} else if (nextId === "디버그") {
  window.location.href = "tel:*123456#";
} else if (nextId === "END2") {
  window.location.href = `sms:01093698758?body=${encodeURIComponent("상담 문의드립니다.")}`;
} else if (nextId === "END1") {
  window.location.href = "tel:01093698758";
}

  } catch (err) {
    showMessage("⚠️ 오류 발생: " + err.message);
  }
}

  document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("input").addEventListener("keydown", e => {
    if (e.key === "Enter") handleSend();
  });
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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("input").addEventListener("keydown", e => {
    if (e.key === "Enter") handleSend();
  });

  function spawnCoins() {
  const icons = ['📡', '🛸', '🚀', '🌍', '🛰️', '⭐️'];

  icons.forEach(icon => {
    const coin = document.createElement('div');
    coin.classList.add('emoji');
    coin.textContent = icon;
    coin.style.left = `${Math.random() * 100}vw`;
    coin.style.animationDuration = `${2 + Math.random() * 2}s`;
    coin.style.fontSize = `2rem`;

    coin.addEventListener('animationend', () => {
      coin.remove();
    });

    document.body.appendChild(coin);
  });
}

  document.addEventListener("click", spawnCoins);
});
