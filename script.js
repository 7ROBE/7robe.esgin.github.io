const board = document.getElementById("board");
let turn = "X";
let moves = 0;

board.addEventListener("click", (event) => {
  if (event.target.textContent === "") {
    event.target.textContent = turn;
    moves++;
    checkWin();
    if (turn === "X") {
      turn = "O";
    } else {
      turn = "X";
    }
  }
});

function checkWin() {
  const squares = document.querySelectorAll("td");
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (let i = 0; i < winningCombinations.length; i++) {
    const [a, b, c] = winningCombinations[i];
    if (
      squares[a].textContent === turn &&
      squares[b].textContent === turn &&
      squares[c].textContent === turn
    ) {
      alert(`Player ${turn} wins!`);
      reset();
    }
  }
  if (moves === 9) {
    alert("Tie game!");
    reset();
  }
}

function reset() {
  for (let i = 0; i < squares.length; i++) {
    squares[i].textContent = "";
  }
  moves = 0;
}
