import { useState, useEffect, useRef } from "react";
import axios from "axios";

const AIML_API_KEY = import.meta.env.VITE_AIML_API_KEY;
const AIML_API_URL = "https://api.aimlapi.com/v1/chat/completions";

const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function getCardImageFilename(value, suit) {
  const valueMap = {
    A: "ace",
    K: "king",
    Q: "queen",
    J: "jack",
    "10": "10",
    "9": "9",
    "8": "8",
    "7": "7",
    "6": "6",
    "5": "5",
    "4": "4",
    "3": "3",
    "2": "2",
  };

  const suitMap = {
    "♠": "spades",
    "♥": "hearts",
    "♦": "diamonds",
    "♣": "clubs",
  };

  const val = valueMap[value];
  const s = suitMap[suit];
  return val && s ? `${import.meta.env.BASE_URL}cards/${val}_of_${s}.png` : null;
}

async function fetchAIAnalysis(hand, board, potSize, callAmount) {
  const prompt = `You are a professional poker player. Given the situation below, provide a strategic analysis and recommendation:\n
Hand: ${hand.map(c => `${c.value}${c.suit}`).join(", ")}\n
Board: ${board.filter(c => c.value && c.suit).map(c => `${c.value}${c.suit}`).join(", ") || "N/A"}\n
Pot Size: $${potSize}, Call Amount: $${callAmount}`;

  try {
    const response = await axios.post(
      AIML_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional poker advisor. Respond with a short and clear summary of the player's situation and a concise recommendation. The response should be no longer than 4–5 sentences. Be friendly but strategic—accessible for newer players, but sharp enough for experienced ones."
          },          
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 250,
        frequency_penalty: 0,
        presence_penalty: 0,
        response_format: {
          type: "text"
        },
        modalities: ["text"]
      },
      {
        headers: {
          "Authorization": `Bearer ${AIML_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices?.[0]?.message?.content ?? "No response received.";
  } catch (error) {
    console.error("AI Analysis error:", error);
    return "AI analysis failed. Please try again.";
  }
}

function CardSelector({ card, onChange, allCards }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClick = () => {
    setShowPicker(!showPicker);
  };

  const isDuplicate = (value, suit) => {
    return allCards.some(
      (c) => c.value === value && c.suit === suit && (c !== card)
    );
  };

  const resetCard = () => {
    onChange({ suit: "", value: "" });
  };

  const selectSuit = (suit) => {
    if (!isDuplicate(card.value, suit)) {
      onChange({ ...card, suit });
    }
  };

  const selectValue = (value) => {
    if (!isDuplicate(value, card.suit)) {
      onChange({ ...card, value });
    }
  };

  const cardImage = getCardImageFilename(card.value, card.suit);

  return (
    <div className="card-selector" style={{ position: "relative" }}>
      <div onClick={handleClick}>
        {cardImage ? (
          <img
            src={cardImage}
            alt={`${card.value} of ${card.suit}`}
            style={{
              width: "70px",
              height: "100px",
              borderRadius: "8px",
              border: "1px solid #444",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          />
        ) : (
          <img
            src="/cards/card_back.jpeg"
            alt="Card Back"
            style={{
              width: "70px",
              height: "100px",
              borderRadius: "8px",
              border: "1px solid #444",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              cursor: "pointer",
            }}
          />
        )}
      </div>

      {showPicker && (
        <div className="picker-popup" ref={pickerRef} style={{ minWidth: "300px" }}>
          <div className="picker-section">
            <strong>Suit</strong>
            <div className="picker-row">
              {suits.map((s) => (
                <button
                  key={s}
                  onClick={() => selectSuit(s)}
                  className={card.suit === s ? "selected" : ""}
                  style={{
                    color: s === "♥" || s === "♦" ? "red" : "black",
                    opacity: isDuplicate(card.value, s) ? 0.4 : 1,
                    pointerEvents: isDuplicate(card.value, s) ? "none" : "auto",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="picker-section">
            <strong>Value</strong>
            <div className="picker-row">
              {values.map((v) => (
                <button
                  key={v}
                  onClick={() => selectValue(v)}
                  className={card.value === v ? "selected" : ""}
                  style={{
                    opacity: isDuplicate(v, card.suit) ? 0.4 : 1,
                    pointerEvents: isDuplicate(v, card.suit) ? "none" : "auto",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="picker-section">
            <button onClick={resetCard} style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
              Reset Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PokerAdvisor() {
    const defaultHand = [
      { suit: "", value: "" },
      { suit: "", value: "" },
    ];
    const defaultBoard = [
      { suit: "", value: "" },
      { suit: "", value: "" },
      { suit: "", value: "" },
      { suit: "", value: "" },
      { suit: "", value: "" },
    ];
  
    const [hand, setHand] = useState([...defaultHand]);
    const [board, setBoard] = useState([...defaultBoard]);
    const [potSize, setPotSize] = useState("Insert Value");
    const [callAmount, setCallAmount] = useState("Insert Value");
    const [aiAnalysis, setAIAnalysis] = useState("Waiting for input...");
    const [loading, setLoading] = useState(false);
  
    const handleHandChange = (index, newCard) => {
      const newHand = [...hand];
      newHand[index] = newCard;
      setHand(newHand);
    };
  
    const handleBoardChange = (index, newCard) => {
      const newBoard = [...board];
      newBoard[index] = newCard;
      setBoard(newBoard);
    };
  
    const resetAll = () => {
      setHand([...defaultHand]);
      setBoard([...defaultBoard]);
      setPotSize("Insert Value");
      setCallAmount("Insert Value");
      setAIAnalysis("Waiting for input...");
    };
  
    const handleAIAnalysis = async () => {
      setLoading(true);
      const result = await fetchAIAnalysis(hand, board, potSize, callAmount);
      setAIAnalysis(result);
      setLoading(false);
    };
  
    const allCards = [...hand, ...board];
    const [showHelp, setShowHelp] = useState(null);
  
    return (
      <div className="page-wrapper">
        <div className="layout">
          <div className="main-panel container">
          <div className="section-wrapper">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.25rem", marginBottom: "1.25rem" }}>
              <img
                src={`${import.meta.env.BASE_URL}pokeradvisorlogo1.png`}
                alt="Poker Advisor Logo"
                style={{ maxHeight: "70px", height: "auto", width: "auto" }}
              />
              <h1 style={{ fontSize: "2.5rem", margin: 0 }}>Poker Advisor</h1>
            </div>
  
            <button onClick={resetAll} className="primary-button" style={{ marginBottom: "1rem" }}>
              Reset All
            </button>
            
            <button className="help-icon" onClick={() => setShowHelp("hand")}>❓</button>
            <section>
              <h2>Your Hand</h2>
              <div className="cards">
                {hand.map((card, index) => (
                  <CardSelector
                    key={index}
                    card={card}
                    allCards={allCards}
                    onChange={(newCard) => handleHandChange(index, newCard)}
                  />
                ))}
              </div>
            </section>
            
            <section>
              <h2>Flop / Turn / River</h2>
              <div className="cards">
                {board.map((card, index) => (
                  <CardSelector
                    key={index}
                    card={card}
                    allCards={allCards}
                    onChange={(newCard) => handleBoardChange(index, newCard)}
                  />
                ))}
              </div>
            </section>

            
            {showHelp === "hand" && (
    <div className="modal" onClick={() => setShowHelp(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-button" onClick={() => setShowHelp(null)}>X</button>
        <h3>How To Work Poker Advisor</h3>
        <p>1. Click the each card listed under 'Your Hand'. For each, choose the suit and the card value according to the hand you have received in your game. This is your pre-flop hand. Then, set the initial pot size and call amount, and analyze your hand.
        <br></br><br></br>
        2. Then, if you did not fold do the same for three more cards under 'Flop/Turn/River'. This is considered the flop. Adjust the pot size and call amount. Now, analyze again.
        <br></br><br></br>
        3. Next is the turn. If not folded already, set the suit and value for the fourth card. Adjust the pot size and call amount. Now, analyze again.
        <br></br><br></br>
        4. Finally, do the same for the river. Set the suit and value for the last card. Adjust the pot size and call amount. Now, analyze again.
        <br></br><br></br>
        *Once the hand is over or you have folded, press 'Reset All' at the top of the screen.*
        </p>
      </div>
    </div>
  )}

            </div>

  <section>
    <h2>Pot Settings</h2>
    <label>
      Pot Size: $&nbsp;
      <input className="input-field" type="text" inputMode="decimal" value={potSize} onChange={(e) => setPotSize(e.target.value)} onFocus={() => {if (potSize === "Insert Value") setPotSize("");}} />
    </label>
    <br /><br />
    <label>
      Call Amount: $&nbsp;
      <input className="input-field" type="text" inputMode="decimal" value={callAmount} onChange={(e) => setCallAmount(e.target.value)} onFocus={() => {if (callAmount === "Insert Value") setCallAmount("");}} />
    </label>
  </section>
  </div>
  
          <div className="ai-panel container" style={{ background: "#1a1a1a", border: "1px solid #444" }}>
          <div className="section-wrapper">
          <button className="help-icon" onClick={() => setShowHelp("ai")}>❓</button>
          <br></br>
            <h2>AI Insights</h2>
            <button onClick={handleAIAnalysis} className="primary-button" style={{ marginBottom: "1rem", width: "100%" }}>
              {loading ? "Analyzing..." : "Run AI Analysis"}
            </button>
  
            <div className="results" style={{ width: "100%" }}>
              <h3>AI Analysis:</h3>
              <p>{aiAnalysis}</p>

              {showHelp === "ai" && (
    <div className="modal" onClick={() => setShowHelp(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-button" onClick={() => setShowHelp(null)}>X</button>
        <h3>Interpreting The Analysis</h3>
        <p>The AI-generated recommendation is designed to provide a quick summary of your current poker situation and suggest a strategic course of action based on standard poker logic. While it takes into account your hand, the board, and pot dynamics, it should be used as a helpful guide—not a strict rule. Poker is a game of both math and instinct, and we encourage you to trust your own judgment when deciding whether to fold, call, raise, or bluff. Please note that this analysis is for informational purposes only; we are not responsible for any betting decisions or game outcomes that result from using this tool.</p>
      </div>
    </div>
  )}
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }
  