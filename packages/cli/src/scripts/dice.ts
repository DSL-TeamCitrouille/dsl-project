function createDiceThrower(
  diceEl: HTMLElement,
  resultEl: HTMLElement,
  buttonEl: HTMLButtonElement
) {
  let isRolling = false;

  return function throwDice() {
    if (isRolling) return;

    

    const faces = parseInt(diceEl.dataset.faces || "6", 10);

    isRolling = true;
    buttonEl.disabled = true;
    resultEl.textContent = "";
    diceEl.textContent = "🎲";
    diceEl.classList.add("rolling");

    setTimeout(() => {
      const result = Math.floor(Math.random() * faces) + 1;
      diceEl.classList.remove("rolling");
      diceEl.textContent = result.toString();
      resultEl.textContent = `Result: ${result}`;

      isRolling = false;
      buttonEl.disabled = false;
    }, 600);
  };
}

export function setupDice() {
  const diceEl = document.querySelector<HTMLElement>(".dice");
  const resultEl = document.querySelector<HTMLElement>(".dice-result");
  const buttonEl = document.querySelector<HTMLButtonElement>(".throw-button");

  if (!diceEl || !resultEl || !buttonEl) {
    console.warn("[Dice] Required elements not found.");
    return;
  }

  // création du handler sans fermeture sur des éléments possiblement null
  const throwDice = createDiceThrower(diceEl, resultEl, buttonEl);

  buttonEl.addEventListener("click", throwDice);
}
