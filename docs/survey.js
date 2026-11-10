// 익명 만족도 조사: 응답을 Google Apps Script 웹 앱(pipeline/survey_apps_script.gs)으로 보내 시트에 쌓는다.
// 만족도 응답은 익명. 추첨 응모를 체크·동의한 경우에만 이름·이메일을 draw로 함께 보내고, 시트에선 '추첨' 탭에 따로 쌓인다. 아래 주소는 Apps Script를 '웹 앱'으로 배포한 뒤 받은 /exec 주소.
const ENDPOINT = "https://script.google.com/macros/s/AKfycbyd2Yutf-E5aahmsX66HkNclVHknI7mQaFCkvzpfMB_Z8famE8L0BQIeeZmuEo-R0T4Cw/exec";
const $ = (s) => document.querySelector(s);
const LABELS = ["매우 불만", "불만", "보통", "만족", "매우 만족"];
const DONE = "survey-sent";

document.querySelectorAll(".rate").forEach((fs) => {
  const q = fs.dataset.q;
  const box = document.createElement("div");
  box.className = "scale";
  box.innerHTML = LABELS.map((t, i) => `<label><input type="radio" name="${q}" value="${i + 1}"><b>${i + 1}</b><span>${t}</span></label>`).join("");
  fs.append(box);
});

const msg = (t, s = "") => { $("#msg").textContent = t; $("#msg").dataset.s = s; };
const val = (n) => document.querySelector(`input[name="${n}"]:checked`)?.value || "";
$("#comment").addEventListener("input", (e) => { $("#cnt").textContent = e.target.value.length; });
$("#join").addEventListener("change", (e) => { $("#draw").hidden = !e.target.checked; });

let sent = false;
try { sent = localStorage.getItem(DONE) === "1"; } catch {}
if (sent) msg("이 브라우저에서 이미 응답하셨어요. 의견이 더 있으면 한 번 더 보내셔도 됩니다.");
if (!ENDPOINT) { msg("조사 접수 준비 중입니다. 곧 열릴 예정이에요."); $("#send").disabled = true; }

$("#sv").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!val("overall")) { msg("전반적인 만족도를 골라 주세요.", "bad"); return; }
  const body = {
    overall: val("overall"), clarity: val("clarity"), useful: val("useful"),
    used: [...document.querySelectorAll('input[name="used"]:checked')].map((x) => x.value).join(", "),
    role: val("role"), comment: $("#comment").value.trim().slice(0, 500),
  };
  if ($("#join").checked) {
    const name = $("#dname").value.trim(), email = $("#demail").value.trim();
    $("#dname").setAttribute("aria-invalid", !name);
    $("#demail").setAttribute("aria-invalid", !email || !$("#demail").checkValidity());
    if (!name) { msg("추첨 응모용 이름을 적어 주세요.", "bad"); $("#dname").focus(); return; }
    if (!email || !$("#demail").checkValidity()) { msg("이메일 주소를 확인해 주세요.", "bad"); $("#demail").focus(); return; }
    if (!$("#dagree").checked) { msg("추첨에 응모하려면 개인정보 수집·이용에 동의해 주세요.", "bad"); return; }
    body.draw = { name, email, agree: true };
  }
  $("#send").disabled = true;
  msg("보내는 중…");
  try {
    // Apps Script는 CORS 응답을 주지 않으므로 no-cors + text/plain으로 보낸다(응답 내용은 읽지 않음)
    await fetch(ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
    try { localStorage.setItem(DONE, "1"); } catch {}
    $("#sv").reset();
    $("#cnt").textContent = "0";
    $("#draw").hidden = true;
    msg("고맙습니다. 응답이 접수됐어요.", "ok");
  } catch {
    msg("보내지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.", "bad");
  } finally {
    $("#send").disabled = false;
  }
});
