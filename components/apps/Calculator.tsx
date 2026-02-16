
import React, { useState } from 'react';

export const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [newNum, setNewNum] = useState(true);

  const handleNum = (num: string) => {
    if (newNum) {
      setDisplay(num);
      setNewNum(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOp = (operator: string) => {
    setOp(operator);
    setPrev(parseFloat(display));
    setNewNum(true);
  };

  const calculate = () => {
    if (prev === null || op === null) return;
    const current = parseFloat(display);
    let result = 0;
    switch(op) {
      case '+': result = prev + current; break;
      case '-': result = prev - current; break;
      case '*': result = prev * current; break;
      case '/': result = prev / current; break;
    }
    setDisplay(result.toString());
    setPrev(null);
    setOp(null);
    setNewNum(true);
  };

  const clear = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
    setNewNum(true);
  };

  // Responsive button class that fills grid cell
  const btnClass = "h-full w-full rounded-2xl flex items-center justify-center text-2xl font-medium transition-all active:scale-95 shadow-lg hover:brightness-125 hover:scale-[1.02] border border-white/5";

  return (
    <div className="h-full w-full bg-[#1c1c1c] text-white flex flex-col p-4">
      {/* Display */}
      <div className="flex-[0.8] flex items-end justify-end p-6 mb-4 bg-black/40 rounded-3xl border border-white/5">
          <span className="text-6xl sm:text-7xl lg:text-8xl font-light tracking-tight truncate">{display}</span>
      </div>
      
      {/* Buttons Grid */}
      <div className="flex-1 grid grid-cols-4 gap-3 sm:gap-4 pb-2">
          {/* Row 1 */}
          <button onClick={clear} className={`${btnClass} bg-slate-300 text-black font-semibold`}>AC</button>
          <button onClick={() => handleNum('+/-')} className={`${btnClass} bg-slate-300 text-black font-semibold`}>±</button>
          <button onClick={() => handleNum('%')} className={`${btnClass} bg-slate-300 text-black font-semibold`}>%</button>
          <button onClick={() => handleOp('/')} className={`${btnClass} bg-amber-500 text-white`}>÷</button>
          
          {/* Row 2 */}
          <button onClick={() => handleNum('7')} className={`${btnClass} bg-slate-800`}>7</button>
          <button onClick={() => handleNum('8')} className={`${btnClass} bg-slate-800`}>8</button>
          <button onClick={() => handleNum('9')} className={`${btnClass} bg-slate-800`}>9</button>
          <button onClick={() => handleOp('*')} className={`${btnClass} bg-amber-500`}>×</button>

          {/* Row 3 */}
          <button onClick={() => handleNum('4')} className={`${btnClass} bg-slate-800`}>4</button>
          <button onClick={() => handleNum('5')} className={`${btnClass} bg-slate-800`}>5</button>
          <button onClick={() => handleNum('6')} className={`${btnClass} bg-slate-800`}>6</button>
          <button onClick={() => handleOp('-')} className={`${btnClass} bg-amber-500`}>-</button>

          {/* Row 4 */}
          <button onClick={() => handleNum('1')} className={`${btnClass} bg-slate-800`}>1</button>
          <button onClick={() => handleNum('2')} className={`${btnClass} bg-slate-800`}>2</button>
          <button onClick={() => handleNum('3')} className={`${btnClass} bg-slate-800`}>3</button>
          <button onClick={() => handleOp('+')} className={`${btnClass} bg-amber-500`}>+</button>

          {/* Row 5 */}
          <button onClick={() => handleNum('0')} className={`${btnClass} bg-slate-800 col-span-2 rounded-2xl`}>0</button>
          <button onClick={() => handleNum('.')} className={`${btnClass} bg-slate-800`}>.</button>
          <button onClick={calculate} className={`${btnClass} bg-amber-500`}>=</button>
      </div>
    </div>
  );
};
