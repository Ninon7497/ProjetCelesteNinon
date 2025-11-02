export function rollDice(faces = 20) {
  return Math.floor(Math.random() * faces) + 1;
}

export function testSkill(bonus = 0, dc = 10) {
  const dice = rollDice(20);
  const total = dice + (bonus || 0);
  return { dice, total, dc, success: total >= dc };
}
