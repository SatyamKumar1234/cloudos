import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export const TicTacToe: React.FC = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const calculateWinner = (squares: string[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = (i: number) => {
    if (calculateWinner(board) || board[i]) return;
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);
  const status = winner 
    ? `Winner: ${winner}` 
    : isDraw 
        ? "Draw!" 
        : `Next player: ${xIsNext ? 'X' : 'O'}`;

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-slate-200 p-4">
      <div className="mb-6 flex items-center justify-between w-full max-w-[200px]">
        <h2 className={`text-xl font-bold ${winner ? 'text-green-400' : 'text-blue-400'}`}>{status}</h2>
        <button onClick={resetGame} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-slate-700 p-2 rounded-xl">
        {board.map((square, i) => (
          <button
            key={i}
            className={`
                w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-lg text-4xl font-bold flex items-center justify-center transition-all duration-200
                ${!square && !winner ? 'hover:bg-slate-750 hover:scale-105' : ''}
                ${square === 'X' ? 'text-blue-500' : 'text-purple-500'}
                ${winner && calculateWinner(board) === square ? 'bg-green-900/20' : ''}
            `}
            onClick={() => handleClick(i)}
            disabled={!!winner || !!square}
          >
            <span className={square ? "animate-in zoom-in spin-in-12 duration-300" : ""}>{square}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
