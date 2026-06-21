const API_BASE = "https://api.mail.tm";

let token = "";
let currentEmail = "";
let currentPassword = "";
let refreshTimer = null;
let currentOtp = "";

const emailInput = document.getElementById("emailAddress");
const generateBtn = document.getElementById("generateBtn");
const refreshBtn = document.getElementById("refreshBtn");
const copyEmailBtn = document.getElementById("copyEmailBtn");
const copyOtpBtn = document.getElementById("copyOtpBtn");

const mailList = document.getElementById("mailList");
const mailContent = document.getElementById("mailContent");

const domainLabel = document.getElementById("domainLabel");
const mailCount = document.getElementById("mailCount");
const messageCounter = document.getElementById("messageCounter");
const statEmails = document.getElementById("statEmails");

const otpCode = document.getElementById("otpCode");

const loader = document.getElementById("loader");
const toast = document.getElementById("toast");

function showLoader() {
loader.classList.remove("hidden");
}

function hideLoader() {
loader.classList.add("hidden");
}

function showToast(message) {
toast.textContent = message;
toast.classList.add("show");

setTimeout(() => {
toast.classList.remove("show");
}, 2500);
}

function randomString(length) {
const chars =
"abcdefghijklmnopqrstuvwxyz0123456789";

let result = "";

for (let i = 0; i < length; i++) {
result += chars[
Math.floor(Math.random() * chars.length)
];
}

return result;
}

async function getDomain() {
const res = await fetch(
`${API_BASE}/domains`
);

const data = await res.json();

if (
!data["hydra:member"] ||
!data["hydra:member"].length
) {
throw new Error("도메인 없음");
}

return data["hydra:member"][0].domain;
}

async function createMailbox() {
try {
showLoader();

```
const domain = await getDomain();

domainLabel.textContent = domain;

const username = randomString(10);

currentPassword = randomString(12);

currentEmail =
  `${username}@${domain}`;

const accountRes =
  await fetch(
    `${API_BASE}/accounts`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        address: currentEmail,
        password: currentPassword
      })
    }
  );

if (!accountRes.ok) {
  throw new Error(
    "계정 생성 실패"
  );
}

const tokenRes =
  await fetch(
    `${API_BASE}/token`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        address: currentEmail,
        password: currentPassword
      })
    }
  );

const tokenData =
  await tokenRes.json();

token = tokenData.token;

emailInput.value =
  currentEmail;

showToast(
  "임시 이메일 생성 완료"
);

await loadMessages();

startAutoRefresh();
```

}
catch (err) {
console.error(err);

```
showToast(
  "생성 실패"
);
```

}
finally {
hideLoader();
}
}

async function loadMessages() {
if (!token) return;

try {

```
const res =
  await fetch(
    `${API_BASE}/messages`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  );

const data =
  await res.json();

const mails =
  data["hydra:member"] || [];

renderMessages(mails);

mailCount.textContent =
  mails.length;

messageCounter.textContent =
  mails.length;

statEmails.textContent =
  mails.length;
```

} catch (err) {

```
console.error(err);
```

}
}

function renderMessages(mails) {

if (!mails.length) {

```
mailList.innerHTML =
  `
  <div class="empty-state">
  <div class="empty-icon">📭</div>
  <p>메일이 없습니다</p>
  </div>
  `;

return;
```

}

mailList.innerHTML = "";

mails.forEach(mail => {

```
const item =
  document.createElement("div");

item.className =
  "mail-item";

item.innerHTML =
  `
  <div class="mail-subject">
  ${mail.subject || "(제목 없음)"}
  </div>

  <div class="mail-from">
  ${mail.from?.address || ""}
  </div>
  `;

item.addEventListener(
  "click",
  () => openMail(mail.id)
);

mailList.appendChild(item);
```

});
}

async function openMail(id) {

try {

```
showLoader();

const res =
  await fetch(
    `${API_BASE}/messages/${id}`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  );

const mail =
  await res.json();

const body =
  mail.html?.[0] ||
  mail.text ||
  mail.intro ||
  "내용 없음";

mailContent.innerHTML =
  `
  <h2>${mail.subject || ""}</h2>
  <hr>
  ${body}
  `;

detectOTP(
  mail.text ||
  body
);
```

} catch (err) {

```
console.error(err);

mailContent.textContent =
  "메일을 불러오지 못했습니다.";
```

} finally {

```
hideLoader();
```

}
}

function detectOTP(content) {

const match =
String(content)
.match(/\b\d{4,8}\b/);

if (match) {

```
currentOtp =
  match[0];

otpCode.textContent =
  currentOtp;
```

} else {

```
currentOtp = "";

otpCode.textContent =
  "------";
```

}
}

function startAutoRefresh() {

if (refreshTimer) {
clearInterval(refreshTimer);
}

refreshTimer =
setInterval(() => {

```
  loadMessages();

}, 10000);
```

}

copyEmailBtn.addEventListener(
"click",
async () => {

```
if (!currentEmail) return;

await navigator.clipboard
  .writeText(currentEmail);

showToast(
  "이메일 복사 완료"
);
```

}
);

copyOtpBtn.addEventListener(
"click",
async () => {

```
if (!currentOtp) return;

await navigator.clipboard
  .writeText(currentOtp);

showToast(
  "OTP 복사 완료"
);
```

}
);

generateBtn.addEventListener(
"click",
createMailbox
);

refreshBtn.addEventListener(
"click",
loadMessages
);

window.addEventListener(
"load",
() => {

```
mailContent.textContent =
  "메일을 선택하세요.";

otpCode.textContent =
  "------";
```

}
);
