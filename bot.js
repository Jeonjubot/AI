let chatData = [], currentNode = null;
  const currentCode = "000000";
  let previousHeight = window.innerHeight;

  let userAnswers = []; // 전체 응답 기록
  let userRating = 0;   // 별점 값 저장

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
        chat.scrollTo({
          top: chat.scrollHeight,
          behavior: "smooth"
        });
      }, 0);
    });
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
      btn.style.padding = "16px 18px";
      btn.style.fontSize = "24px";
      btn.style.border = "none";
      btn.style.borderRadius = "24px";
      btn.style.background = "#fbeec0";
      btn.style.cursor = "pointer";
      btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
      btn.style.width = "100%";
      btn.style.maxWidth = "360px";
      btn.style.margin = "0 auto";

      btn.onclick = () => {
  if (btn.disabled) return;
  btn.disabled = true;

  const allButtons = btn.parentElement.querySelectorAll("button");
  allButtons.forEach(b => {
    b.disabled = true;
    b.style.background = "#ccc"; // 회색 처리
    b.style.color = "#888";      // 글자도 흐리게
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
  const imagePath = `./이미지/${currentCode}/${imageName}.png`;
  try {
    const res = await fetch(imagePath);
    if (res.ok) {
      showMessage(
        `<img src="${imagePath}" style="max-width:100%; border-radius:12px; cursor:pointer;" onclick="openModal('${imagePath}')">`,
        false,
        true
      );
      return true;
    }
  } catch {}
  return false;
}

  async function showVideoFirst(videoName) {
    const videoPath = `./영상/${currentCode}/${videoName}.mp4`;
    try {
      const res = await fetch(videoPath);
      if (res.ok) {
        showMessage(
          `<video controls style="max-width:100%; border-radius:12px;">
            <source src="${videoPath}" type="video/mp4">
            이 브라우저는 video 태그를 지원하지 않습니다.
          </video>`,
          false,
          true
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
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    if (currentNode.영상) {
      await showVideoFirst(currentNode.영상);
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    showMessage(currentNode.질문내용);

    if (currentNode.선택지 && currentNode.선택지.length > 0) {
      showOptions(currentNode.선택지);
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
      const imagePath = `./이미지/${currentCode}/${val}.png`;
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
      if (next.다음ID === "END") {
  showRating();
} else if (next.다음ID === "END1" || next.다음ID === "END2") {
  showRating();
}
 else {
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
  box.style.background = "#fff";
  box.style.borderRadius = "24px";
  box.style.padding = "20px";
  box.style.marginTop = "8px";
  box.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
  box.style.textAlign = "center";

  const title = document.createElement("div");
  title.innerHTML = "서비스는 얼마나 만족스러우셨나요?";
  title.style.marginBottom = "12px";
  title.style.fontSize = "17px";

  const starContainer = document.createElement("div");
  starContainer.id = "starContainer";
  starContainer.style.display = "flex";
  starContainer.style.justifyContent = "center";
  starContainer.style.gap = "6px";
  starContainer.style.marginBottom = "16px";

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("img");
    star.src = "./이미지/star-empty.png";
    star.id = `star-${i}`;
    star.style.width = "40px";
    star.style.cursor = "pointer";
    star.onclick = () => selectStar(i);
    starContainer.appendChild(star);
  }
  const Note = document.createElement("div");
  Note.innerHTML = "※ 별점을 선택하신 후 <strong>확인</strong> 버튼을 눌러주세요.";
  Note.style.fontSize = "14px";
  Note.style.marginBottom = "16px";
  Note.style.color = "#555";

  const button = document.createElement("button");
  button.textContent = "확인";
  button.onclick = submitRating;
  button.style.padding = "10px 20px";
  button.style.fontSize = "16px";
  button.style.border = "none";
  button.style.borderRadius = "8px";
  button.style.background = "#007bff";
  button.style.color = "white";
  button.style.cursor = "pointer";

  box.appendChild(title);
  box.appendChild(starContainer);
  box.appendChild(Note);
  box.appendChild(button);
  wrapper.appendChild(box);
  chat.appendChild(wrapper);
setTimeout(() => {
  wrapper.scrollIntoView({ behavior: "smooth", block: "end" });
  chat.scrollTop = chat.scrollHeight;
}, 400);
}

  function selectStar(n) {
    userRating = n;
    for (let i = 1; i <= 5; i++) {
      document.getElementById(`star-${i}`).src = i <= n ? './이미지/star-filled.png' : './이미지/star-empty.png';
    }
  }

  async function submitRating() {
  if (userRating === 0) {
    alert("별점을 선택해주세요!");
    return;
  }

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

if (nextId === "END2") {
  let message = "문의드립니다.";

  if (lastID === "철거Q2") {
    message = "철거 관련 문의입니다.";
  } else if (lastID === "댁내형Q2") {
    message = "댁내형 설치관련 문의입니다.";
  } else if (lastID === "기가Q2") {
    message = "기가아토 설치관련 문의입니다.";
  }

  window.location.href = `sms:01000000000?body=${encodeURIComponent(message)}`;
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

  (async () => {
    try {
      const res = await fetch(`./코드/${currentCode}.json`);
      if (!res.ok) throw new Error("지역코드 데이터 없음");
      chatData = await res.json();

      showMessage("🙂 안녕하세요. 고객님!!\n😘 고객 중심의 서비스와\n😎 혁신을 선도하는 파트너\n😊 KT MOS 남부입니다.");
      await new Promise(resolve => setTimeout(resolve, 800));
      showQuestion("Q1");
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
}

function closeModal() {
  const modal = document.getElementById("imageModal");
  modal.style.display = "none";
}
