import React, { useEffect, useState, useMemo } from "react";
import { getCampains } from "../../helper/getCampains";
import { ICONS } from "../../constants/constants";
import { FaImage, FaTrash, FaVideo } from "react-icons/fa";
import { updateCampains } from "../../helper/updateCampains";
import { deleteCampain } from "../../helper/deleteCampain";
import { insertNewCampain } from "../../helper/insertNewCampain";
import { getCampainTexts } from "../../helper/getCampainTexts";
import { insertCampainText } from "../../helper/insertCampainText";
import { updateCampainText } from "../../helper/updateCampainText";
import { deleteCampainText } from "../../helper/deleteCampainText";
import { toast } from "react-toastify";
import JoditEditor from "jodit-react";
import styles from "../../pages/AdminManager/adminmanager.module.css";

const Campain = () => {
  const [campains, setCampains] = useState([]);
  const [newCampain, setNewCampain] = useState();
  const [inEdit, setInEdit] = useState();
  const [reload, setReload] = useState(false);

  // Estados para gerenciar textos das campanhas
  const [campainTexts, setCampainTexts] = useState([]);
  const [selectedCampainId, setSelectedCampainId] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [editingTextId, setEditingTextId] = useState(null);
  const [reloadTexts, setReloadTexts] = useState(false);
  
  // Estados para gerenciar imagens
  const [textImage, setTextImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Estados para gerenciar vídeos
  const [textVideo, setTextVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Configuração do Jodit Editor
  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Digite o conteúdo... Pode usar HTML e variáveis como {{nome_doador}}, {{valor_doacao}}, {{imagem}}",
      height: 400,
      language: "pt_br",
      toolbarButtonSize: "large",
      buttons: [
        "bold",
        "italic",
        "underline",
        "|",
        "ul",
        "ol",
        "|",
        "font",
        "fontsize",
        "brush",
        "|",
        "align",
        "|",
        "link",
        "image",
        "video",
        "|",
        "emoji",
        "|",
        "table",
        "|",
        "undo",
        "redo",
        "|",
        "hr",
        "source"
      ],
      uploader: {
        insertImageAsBase64URI: true
      },
      style: {
        background: '#1e1e1e',
        color: '#e0e0e0'
      },
      // Botão customizado de emojis
      controls: {
        emoji: {
          tooltip: "Inserir Emoji",
          icon: "🙂",
          popup: (editor, current, close) => {
            const emojis = [
              // 🎄 NATAL - Emojis Temáticos
              "🎄", "🎅", "🤶", "🎁", "🎀", "🔔", "⭐", "🌟", "✨", "❄️",
              "⛄", "☃️", "🦌", "🛷", "🕯️", "🧦", "🎊", "🎉", "🍪", "🥛",
              "🎶", "🔴", "🟢", "⚪", "🟡", "🔵", "🎵", "🎼", "🙏", "⛪",
              "🌠", "💫", "🎇", "🎆", "👼", "😇", "🎈", "🎀", "🧸", "🍬",
              
              // 😀 Rostos e emoções
              "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
              "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
              "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
              "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥",
              "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮",
              "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓",
              "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺",
              "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣",
              "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈",
              "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾",
              "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾",
              
              // 👋 Gestos e mãos
              "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟",
              "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎",
              "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏",
              "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶",
              
              // 👤 Pessoas
              "👶", "👧", "🧒", "👦", "👩", "🧑", "👨", "👩‍🦱", "🧑‍🦱", "👨‍🦱",
              "👩‍🦰", "🧑‍🦰", "👨‍🦰", "👱‍♀️", "👱", "👱‍♂️", "👩‍🦳", "🧑‍🦳", "👨‍🦳", "👩‍🦲",
              "🧑‍🦲", "👨‍🦲", "🧔", "👵", "🧓", "👴", "👲", "👳‍♀️", "👳", "👳‍♂️",
              "🧕", "👮‍♀️", "👮", "👮‍♂️", "👷‍♀️", "👷", "👷‍♂️", "💂‍♀️", "💂", "💂‍♂️",
              
              // ❤️ Corações e símbolos de amor
              "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
              "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️",
              "💋", "💌", "💘", "💝", "💖", "💗", "💓", "💞", "💕", "❣️",
              
              // ⭐ Estrelas e símbolos
              "⭐", "🌟", "✨", "💫", "🌠", "☀️", "🌤️", "⛅", "🌥️", "🌦️",
              "🌧️", "⛈️", "🌩️", "⚡", "🔥", "💥", "❄️", "🌨️", "☃️", "⛄",
              "🌙", "🌛", "🌜", "🌚", "🌝", "🌞", "🪐", "⭐", "🌟", "💫",
              
              // ✅ Símbolos e sinais
              "✅", "☑️", "✔️", "✖️", "❌", "❎", "➕", "➖", "➗", "✖️",
              "♾️", "💯", "💢", "💬", "💭", "🗯️", "💤", "💮", "♨️", "💈",
              "🛑", "⚠️", "🚸", "⛔", "🚫", "🚳", "🚭", "🚯", "🚱", "🚷",
              "📵", "🔞", "☢️", "☣️", "⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️",
              "⬅️", "↖️", "↕️", "↔️", "↩️", "↪️", "⤴️", "⤵️", "🔃", "🔄",
              "🔙", "🔚", "🔛", "🔜", "🔝", "✔️", "☑️", "🔘", "🔴", "🟠",
              "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "🔸",
              "🔹", "🔶", "🔷", "🔳", "🔲", "▪️", "▫️", "◾", "◽", "◼️",
              "◻️", "⬛", "⬜", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "🟫",
              
              // 🎉 Celebração e eventos
              "🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🧁", "🍰", "🎆", "🎇",
              "🧨", "✨", "🎄", "🎃", "🎗️", "🎟️", "🎫", "🎖️", "🏆", "🏅",
              "🥇", "🥈", "🥉", "⚽", "⚾", "🥎", "🏀", "🏐", "🏈", "🏉",
              "🎾", "🥏", "🎳", "🏏", "🏑", "🏒", "🥍", "🏓", "🏸", "🥊",
              "🥋", "🥅", "⛳", "⛸️", "🎣", "🤿", "🎽", "🎿", "🛷", "🥌",
              
              // 🍕 Comida e bebida
              "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍏",
              "🍐", "🍑", "🍒", "🍓", "🥝", "🍅", "🥥", "🥑", "🍆", "🥔",
              "🥕", "🌽", "🌶️", "🥒", "🥬", "🥦", "🧄", "🧅", "🍄", "🥜",
              "🌰", "🍞", "🥐", "🥖", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖",
              "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯",
              "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🥣", "🥗", "🍿", "🧈",
              "🧂", "🥫", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠",
              "🍢", "🍣", "🍤", "🍥", "🥮", "🍡", "🥟", "🥠", "🥡", "🦀",
              "🦞", "🦐", "🦑", "🦪", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂",
              "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "🥛",
              "☕", "🍵", "🧃", "🥤", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃",
              "🍸", "🍹", "🧉", "🍾", "🧊", "🥄", "🍴", "🍽️",
              
              // 🐶 Animais e natureza
              "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
              "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒",
              "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇",
              "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜",
              "🦟", "🦗", "🕷️", "🕸️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕",
              "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳",
              "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛",
              "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖",
              "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈",
              
              // 🌹 Plantas e flores
              "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🌲", "🌳", "🌴",
              "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🌸", "💐",
              "🏵️", "🌰", "🥜", "🍄",
              
              // 🏠 Lugares e construções
              "🏠", "🏡", "🏘️", "🏚️", "🏗️", "🏭", "🏢", "🏬", "🏣", "🏤",
              "🏥", "🏦", "🏨", "🏪", "🏫", "🏩", "💒", "🏛️", "⛪", "🕌",
              "🕍", "🛕", "🕋", "⛩️", "🗾", "🎑", "🏞️", "🌅", "🌄", "🌠",
              "🎇", "🎆", "🌇", "🌆", "🏙️", "🌃", "🌌", "🌉", "🌁",
              
              // 🚗 Transportes
              "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
              "🚚", "🚛", "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵", "🏍️",
              "🛺", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃",
              "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇", "🚊",
              "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️", "🚀", "🛸", "🚁",
              "🛶", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", "⛽", "🚧",
              "🚦", "🚥", "🚏", "🗺️", "🗿", "🗽", "🗼", "🏰", "🏯", "🏟️",
              
              // 📱 Objetos e tecnologia
              "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️",
              "🗜️", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️",
              "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️",
              "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋", "🔌",
              "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴", "💶",
              "💷", "💰", "💳", "💎", "⚖️", "🧰", "🔧", "🔨", "⚒️", "🛠️",
              "⛏️", "🔩", "⚙️", "🧱", "⛓️", "🧲", "🔫", "💣", "🧨", "🪓",
              "🔪", "🗡️", "⚔️", "🛡️", "🚬", "⚰️", "⚱️", "🏺", "🔮", "📿",
              
              // 📚 Livros e escrita
              "📚", "📖", "📕", "📗", "📘", "📙", "📓", "📔", "📒", "📃",
              "📜", "📄", "📰", "🗞️", "📑", "🔖", "🏷️", "💰", "💴", "💵",
              "💶", "💷", "💸", "💳", "🧾", "💹", "✉️", "📧", "📨", "📩",
              "📤", "📥", "📦", "📫", "📪", "📬", "📭", "📮", "🗳️", "✏️",
              "✒️", "🖋️", "🖊️", "🖌️", "🖍️", "📝", "💼", "📁", "📂", "🗂️",
              "📅", "📆", "🗒️", "🗓️", "📇", "📈", "📉", "📊", "📋", "📌",
              "📍", "📎", "🖇️", "📏", "📐", "✂️", "🗃️", "🗄️", "🗑️",
              
              // 🎨 Artes e hobbies
              "🎨", "🖼️", "🎭", "🎪", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷",
              "🎺", "🎸", "🪕", "🎻", "🎲", "♟️", "🎯", "🎳", "🎮", "🎰",
              "🧩",
              
              // 👗 Roupas e acessórios
              "👓", "🕶️", "🥽", "🥼", "🦺", "👔", "👕", "👖", "🧣", "🧤",
              "🧥", "🧦", "👗", "👘", "🥻", "🩱", "🩲", "🩳", "👙", "👚",
              "👛", "👜", "👝", "🎒", "👞", "👟", "🥾", "🥿", "👠", "👡",
              "🩰", "👢", "👑", "👒", "🎩", "🎓", "🧢", "⛑️", "💄", "💍",
              "💎", "🔇", "🔈", "🔉", "🔊",
              
              // 🛋️ Objetos domésticos
              "🛋️", "🛏️", "🛁", "🚽", "🚿", "🧴", "🧷", "🧹", "🧺", "🧻",
              "🧼", "🧽", "🧯", "🛒", "🚬", "⚰️", "⚱️", "🗿", "🧿",
              
              // 🔨 Ferramentas
              "🔨", "⚒️", "🛠️", "⛏️", "🔧", "🔩", "⚙️", "🗜️", "⚖️", "🦯",
              "🔗", "⛓️", "🧰", "🧲", "⚗️", "🧪", "🧫", "🧬", "🔬", "🔭",
              "📡", "💉", "🩸", "💊", "🩹", "🩺", "🌡️",
              
              // 🚪 Casa e escritório
              "🚪", "🛗", "🪞", "🪟", "🛏️", "🛋️", "🪑", "🚽", "🚿", "🛁",
              "🧴", "🧷", "🧹", "🧺", "🧻", "🧼", "🧽", "🧯",
              
              // ⏰ Relógios
              "⌚", "⏰", "⏱️", "⏲️", "🕰️", "🕐", "🕑", "🕒", "🕓", "🕔",
              "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛", "🕜", "🕝", "🕞",
              "🕟", "🕠", "🕡", "🕢", "🕣", "🕤", "🕥", "🕦", "🕧",
              
              // 🔐 Segurança
              "🔐", "🔒", "🔓", "🔏", "🔑", "🗝️", "🔎", "🔍", "🔦", "🏮",
              "🪔", "💡", "🔦", "🕯️", "🪔",
              
              // 🎁 Outros objetos
              "🧧", "✉️", "📩", "📨", "📧", "💌", "📥", "📤", "📦", "🏷️",
              "💳", "💸", "💵", "💴", "💶", "💷", "💰", "🪙", "💎", "⚖️",
              "🧰", "🧲", "🧪", "🧫", "🧬", "🔬", "🔭", "📡", "💉", "🩸",
              "💊", "🩹", "🩺", "🌡️", "🧹", "🧺", "🧻", "🚽", "🚰", "🚿",
              "🛁", "🧴", "🧷", "🧼", "🧽", "🧯", "🛒", "🚬",
              
              // 🎌 Bandeiras e símbolos
              "🏳️", "🏴", "🏁", "🚩", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇧🇷", "🇺🇸", "🇬🇧",
              "🇫🇷", "🇩🇪", "🇮🇹", "🇪🇸", "🇵🇹", "🇦🇷", "🇲🇽", "🇨🇦", "🇯🇵", "🇨🇳",
              
              // 🎀 Decoração
              "🎀", "🎁", "🎊", "🎉", "🎈", "🎏", "🎐", "🧧", "✨", "🎎",
              "🎑", "🎍", "🎋", "🎄",
              
              // 🔔 Sons e música
              "🔔", "🔕", "📢", "📣", "📯", "🔔", "🎵", "🎶", "🎼", "🎤",
              "🎧", "📻", "🎷", "🎸", "🎹", "🎺", "🎻", "🪕", "🥁", "🎬",
              
              // 💿 Mídia
              "💿", "📀", "💾", "💽", "📼", "📷", "📸", "📹", "🎥", "📽️",
              "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️"
            ];

            const div = editor.create.div("emoji-picker", {
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(10, 1fr)",
                gap: "5px",
                padding: "10px",
                maxWidth: "400px",
                maxHeight: "300px",
                overflowY: "auto",
                background: "#2a2a2a",
                borderRadius: "8px"
              }
            });

            emojis.forEach((emoji) => {
              const button = editor.create.element("button", {
                type: "button",
                style: {
                  fontSize: "24px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "5px",
                  borderRadius: "4px",
                  transition: "all 0.2s"
                }
              });
              button.textContent = emoji;
              button.addEventListener("click", () => {
                editor.selection.insertHTML(emoji);
                close();
              });
              button.addEventListener("mouseenter", () => {
                button.style.background = "#3a3a3a";
                button.style.transform = "scale(1.2)";
              });
              button.addEventListener("mouseleave", () => {
                button.style.background = "transparent";
                button.style.transform = "scale(1)";
              });
              div.appendChild(button);
            });

            return div;
          }
        }
      }
    }),
    []
  );

  useEffect(() => {
    const campain = async () => {
      const response = await getCampains();
      setCampains(response);
    };
    campain();
  }, [inEdit, reload]);

  // Buscar textos quando uma campanha é selecionada
  useEffect(() => {
    const fetchTexts = async () => {
      if (selectedCampainId) {
        const texts = await getCampainTexts(selectedCampainId);
        setCampainTexts(texts);
      } else {
        const texts = await getCampainTexts();
        setCampainTexts(texts);
      }
    };
    fetchTexts();
  }, [selectedCampainId, reloadTexts]);

  const handleChange = (id, field, value) => {
    const update = campains.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setCampains(update);
  };

  const handleEdit = async (id) => {
    if (inEdit) {
      const updateCampain = campains.find((c) => c.id === id);
      await updateCampains(updateCampain);
      setInEdit();
    } else {
      setInEdit(id);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja mesmo deletar esta campanha?")) {
      await deleteCampain(id);
      setReload((prev) => !prev);
    }
  };

  const handleNewCampain = async () => {
    if (newCampain === "") {
      toast.warning("Preencha o campo 'Nova Campanha' corretamente...");
      return;
    }
    await insertNewCampain(newCampain);
    setReload((prev) => !prev);
    setNewCampain("");
  };

  // Função para lidar com seleção de imagem
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB em bytes
      if (file.size > maxSize) {
        toast.error('A imagem deve ter no máximo 5MB.');
        return;
      }

      setTextImage(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para remover imagem
  const handleRemoveImage = () => {
    setTextImage(null);
    setImagePreview(null);
  };

  // Função para lidar com seleção de vídeo
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('video/')) {
        toast.error('Por favor, selecione apenas arquivos de vídeo.');
        return;
      }
      
      // Validar tamanho (máximo 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB em bytes
      if (file.size > maxSize) {
        toast.error('O vídeo deve ter no máximo 50MB.');
        return;
      }

      setTextVideo(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para remover vídeo
  const handleRemoveVideo = () => {
    setTextVideo(null);
    setVideoPreview(null);
  };

  // Funções para gerenciar textos das campanhas
  const handleSaveText = async () => {
    if (!selectedCampainId) {
      toast.warning("Selecione uma campanha!");
      return;
    }
    if (!textTitle.trim()) {
      toast.warning("Digite um título para o texto!");
      return;
    }
    if (!textContent.trim()) {
      toast.warning("Digite o conteúdo do texto!");
      return;
    }

    // Preparar dados do texto
    const textData = {
      campain_id: parseInt(selectedCampainId),
      title: textTitle,
      content: textContent,
    };

    // Adicionar imagem se existir
    if (imagePreview) {
      textData.image = imagePreview; // base64
    }

    // Adicionar vídeo se existir
    if (videoPreview) {
      textData.video = videoPreview; // base64
    }

    if (editingTextId) {
      // Atualizar texto existente
      await updateCampainText(editingTextId, textData);
    } else {
      // Inserir novo texto
      await insertCampainText(textData);
    }

    // Limpar formulário
    setTextTitle("");
    setTextContent("");
    setTextImage(null);
    setImagePreview(null);
    setTextVideo(null);
    setVideoPreview(null);
    setEditingTextId(null);
    setReloadTexts((prev) => !prev);
  };

  const handleEditText = (text) => {
    setEditingTextId(text.id);
    setTextTitle(text.title);
    setTextContent(text.content);
    setSelectedCampainId(text.campain_id.toString());
    
    // Carregar imagem se existir
    if (text.image) {
      setImagePreview(text.image);
      setTextImage({ name: "imagem_salva.jpg" }); // Placeholder para indicar que há imagem
    }
    
    // Carregar vídeo se existir
    if (text.video) {
      setVideoPreview(text.video);
      setTextVideo({ name: "video_salvo.mp4" }); // Placeholder para indicar que há vídeo
    }
    
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteText = async (id) => {
    if (window.confirm("Deseja mesmo deletar este texto?")) {
      await deleteCampainText(id);
      setReloadTexts((prev) => !prev);
    }
  };

  const handleCancelEdit = () => {
    setEditingTextId(null);
    setTextTitle("");
    setTextContent("");
    setSelectedCampainId("");
    setTextImage(null);
    setImagePreview(null);
    setTextVideo(null);
    setVideoPreview(null);
  };

  // Função para gerar preview com imagem e vídeo substituídos
  const getPreviewContent = () => {
    if (!textContent) return "";
    
    let preview = textContent;
    
    // Substituir marcador {{imagem}} pela imagem real
    if (imagePreview) {
      const imageTag = `<img src="${imagePreview}" alt="Imagem da campanha" style="max-width: 100%; height: auto; border-radius: 6px; margin: 12px 0;" />`;
      preview = preview.replace(/\{\{imagem\}\}/gi, imageTag);
    } else {
      // Se não há imagem, mostrar placeholder
      preview = preview.replace(/\{\{imagem\}\}/gi, '<div style="padding: 20px; background: #2f2d2d; border: 2px dashed #faa01c; border-radius: 6px; text-align: center; color: #9e9e9e; margin: 12px 0;">📷 Imagem será inserida aqui</div>');
    }
    
    // Substituir marcador {{video}} pelo vídeo real
    if (videoPreview) {
      const videoTag = `<video src="${videoPreview}" controls style="max-width: 100%; height: auto; border-radius: 6px; margin: 12px 0;">Seu navegador não suporta vídeos.</video>`;
      preview = preview.replace(/\{\{video\}\}/gi, videoTag);
    } else {
      // Se não há vídeo, mostrar placeholder
      preview = preview.replace(/\{\{video\}\}/gi, '<div style="padding: 20px; background: #2f2d2d; border: 2px dashed #4a90d9; border-radius: 6px; text-align: center; color: #9e9e9e; margin: 12px 0;">🎬 Vídeo será inserido aqui</div>');
    }
    
    return preview;
  };

  return (
    <div className={styles.campainContainer}>
      {/* Header com Título */}
      <div className={styles.campainHeader}>
        <h2 className={styles.campainTitle}>{ICONS.MEGAPHONE} Gerenciamento de Campanhas</h2>
      </div>

      {/* Seção: Gerenciar Campanhas */}
      <div className={styles.campainSection}>
        <div className={styles.campainSectionHeader}>
          <h3>📋 Campanhas Cadastradas</h3>
          <span className={styles.campainCount}>
            {campains?.length || 0} {campains?.length === 1 ? 'campanha' : 'campanhas'}
          </span>
        </div>

        <div className={styles.campainList}>
          {campains && campains.length > 0 ? (
            campains.map((cp) => (
              <div key={cp.id} className={styles.campainItem}>
                <div className={styles.campainItemContent}>
                  <input
                    type="text"
                    value={cp.campain_name || ""}
                    onChange={(e) =>
                      handleChange(cp.id, "campain_name", e.target.value)
                    }
                    readOnly={inEdit !== cp.id}
                    className={styles.campainInput}
                  />
                </div>
                <div className={styles.campainItemActions}>
                  <button 
                    onClick={() => handleEdit(cp.id)}
                    className={`${styles.campainBtn} ${styles.iconBtn} ${inEdit === cp.id ? styles.success : styles.secondary}`}
                    title={inEdit !== cp.id ? "Editar" : "Salvar"}
                  >
                    {inEdit !== cp.id ? ICONS.EDIT : ICONS.CONFIRMED}
                  </button>
                  <button 
                    onClick={() => handleDelete(cp.id)}
                    className={`${styles.campainBtn} ${styles.iconBtn} ${styles.danger}`}
                    title="Deletar"
                  >
                    {ICONS.TRASH}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>Nenhuma campanha cadastrada ainda.</p>
              <p className={styles.emptyStateHint}>Crie sua primeira campanha abaixo!</p>
            </div>
          )}
        </div>

        <div className={styles.campainAddNew}>
          <h4>Adicionar Nova Campanha</h4>
          <div className={styles.campainAddNewForm}>
            <div className={styles.formGroup}>
              <label>Nome da Campanha</label>
              <input
                value={newCampain}
                type="text"
                onChange={(e) => setNewCampain(e.target.value)}
                placeholder="Ex: Natal Solidário 2023"
                className={styles.campainInput}
              />
            </div>
            <button 
              onClick={handleNewCampain}
              className={`${styles.campainBtn} ${styles.primary}`}
            >
              {ICONS.ADD} Adicionar Campanha
            </button>
          </div>
        </div>
      </div>

      {/* Seção: Textos Estilizados */}
      <div className={styles.campainSection}>
        <div className={styles.campainSectionHeader}>
          <h3>
            {editingTextId ? "✏️ Editar Texto da Campanha" : "📝 Novo Texto Para Campanha"}
          </h3>
          {editingTextId && (
            <span className={styles.campainBadge}>Modo Edição</span>
          )}
        </div>

        <div className={styles.campainForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Campanha Associada *</label>
              <select
                value={selectedCampainId}
                onChange={(e) => setSelectedCampainId(e.target.value)}
                className={styles.campainSelect}
              >
                <option value="">Selecione uma campanha...</option>
                {campains?.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.campain_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Título do Texto *</label>
              <input
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Ex: Mensagem de Boas-Vindas"
                className={styles.campainInput}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Conteúdo (HTML Suportado) *</label>
            <JoditEditor
              value={textContent}
              config={editorConfig}
              onBlur={(newContent) => setTextContent(newContent)}
              onChange={(newContent) => {}}
            />
            <div className={styles.textareaHint}>
              💡 Dicas: 
              <br />• Use variáveis como <code>{"{{nome_doador}}"}</code>, <code>{"{{valor_doacao}}"}</code> para personalização
              <br />• Use <code>{"{{imagem}}"}</code> para posicionar a imagem onde desejar no texto
              <br />• Use <code>{"{{video}}"}</code> para posicionar o vídeo onde desejar no texto
            </div>
          </div>

          {/* Upload de Imagem */}
          <div className={styles.formGroup}>
            <label>Anexar Imagem (opcional)</label>
            <div className={styles.imageUploadContainer}>
              <input 
                type="file" 
                id="campain-image-upload"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.imageInput}
              />
              <label htmlFor="campain-image-upload" className={styles.imageUploadLabel}>
                <FaImage /> Escolher Imagem
              </label>
              
              {imagePreview && (
                <div className={styles.imagePreviewContainer}>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className={styles.imagePreview}
                  />
                  <button 
                    type="button"
                    onClick={handleRemoveImage}
                    className={styles.removeImageButton}
                    title="Remover imagem"
                  >
                    <FaTrash />
                  </button>
                  {textImage && (
                    <span className={styles.imageName}>{textImage.name}</span>
                  )}
                </div>
              )}
            </div>
            {imagePreview && (
              <div className={styles.imageHint}>
                ✅ Imagem carregada! Use <code>{"{{imagem}}"}</code> no texto para posicioná-la
              </div>
            )}
          </div>

          {/* Upload de Vídeo */}
          <div className={styles.formGroup}>
            <label>Anexar Vídeo (opcional)</label>
            <div className={styles.imageUploadContainer}>
              <input 
                type="file" 
                id="campain-video-upload"
                accept="video/*"
                onChange={handleVideoChange}
                className={styles.imageInput}
              />
              <label htmlFor="campain-video-upload" className={styles.videoUploadLabel}>
                <FaVideo /> Escolher Vídeo
              </label>
              
              {videoPreview && (
                <div className={styles.videoPreviewContainer}>
                  <video 
                    src={videoPreview} 
                    controls
                    className={styles.videoPreview}
                  >
                    Seu navegador não suporta vídeos.
                  </video>
                  <button 
                    type="button"
                    onClick={handleRemoveVideo}
                    className={styles.removeImageButton}
                    title="Remover vídeo"
                  >
                    <FaTrash />
                  </button>
                  {textVideo && (
                    <span className={styles.imageName}>{textVideo.name}</span>
                  )}
                </div>
              )}
            </div>
            {videoPreview && (
              <div className={styles.videoHint}>
                ✅ Vídeo carregado! Use <code>{"{{video}}"}</code> no texto para posicioná-lo
              </div>
            )}
          </div>

          {textContent && (
            <div className={styles.formGroup}>
              <label>Pré-visualização:</label>
              <div
                className={styles.textPreview}
                dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
              />
            </div>
          )}

          <div className={styles.formActions}>
            <button 
              onClick={handleSaveText}
              className={`${styles.campainBtn} ${styles.primary}`}
            >
              {editingTextId ? ICONS.CONFIRMED + " Atualizar Texto" : ICONS.ADD + " Salvar Texto"}
            </button>
            {editingTextId && (
              <button
                onClick={handleCancelEdit}
                className={`${styles.campainBtn} ${styles.secondary}`}
              >
                {ICONS.CANCEL} Cancelar Edição
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de textos existentes */}
      <div className={styles.campainSection}>
        <div className={styles.campainSectionHeader}>
          <h3>📚 Textos Cadastrados</h3>
          <span className={styles.campainCount}>
            {campainTexts.length} {campainTexts.length === 1 ? 'texto' : 'textos'}
          </span>
        </div>

        <div className={styles.campainFilterContainer}>
          <div className={styles.formGroup}>
            <label>Filtrar por Campanha:</label>
            <select
              value={selectedCampainId}
              onChange={(e) => setSelectedCampainId(e.target.value)}
              className={styles.campainSelect}
            >
              <option value="">Todas as campanhas</option>
              {campains?.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.campain_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.textsList}>
          {campainTexts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum texto cadastrado {selectedCampainId ? 'para esta campanha' : 'ainda'}.</p>
              <p className={styles.emptyStateHint}>Crie seu primeiro texto acima!</p>
            </div>
          ) : (
            campainTexts.map((text) => {
              const campain = campains.find((c) => c.id === text.campain_id);
              return (
                <div key={text.id} className={styles.textCard}>
                  <div className={styles.textCardHeader}>
                    <div className={styles.textCardInfo}>
                      <h4 className={styles.textCardTitle}>{text.title}</h4>
                      <div className={styles.textCardMeta}>
                        <span className={styles.textCardBadge}>
                          📋 {campain?.campain_name || "N/A"}
                        </span>
                        <span className={styles.textCardDate}>
                          🕒 {new Date(text.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <div className={styles.textCardActions}>
                      <button
                        onClick={() => handleEditText(text)}
                        className={`${styles.campainBtn} ${styles.iconBtn} ${styles.secondary}`}
                        title="Editar"
                      >
                        {ICONS.EDIT}
                      </button>
                      <button
                        onClick={() => handleDeleteText(text.id)}
                        className={`${styles.campainBtn} ${styles.iconBtn} ${styles.danger}`}
                        title="Deletar"
                      >
                        {ICONS.TRASH}
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.textCardBody}>
                    <label className={styles.textCardLabel}>Conteúdo:</label>
                    <div
                      className={styles.textCardContent}
                      dangerouslySetInnerHTML={{ 
                        __html: (() => {
                          let content = text.content;
                          
                          // Substituir {{imagem}}
                          if (text.image) {
                            content = content.replace(
                              /\{\{imagem\}\}/gi, 
                              `<img src="${text.image}" alt="Imagem da campanha" style="max-width: 100%; height: auto; border-radius: 6px; margin: 12px 0;" />`
                            );
                          } else {
                            content = content.replace(
                              /\{\{imagem\}\}/gi, 
                              '<div style="padding: 20px; background: #2f2d2d; border: 2px dashed #faa01c; border-radius: 6px; text-align: center; color: #9e9e9e; margin: 12px 0;">📷 Imagem não anexada</div>'
                            );
                          }
                          
                          // Substituir {{video}}
                          if (text.video) {
                            content = content.replace(
                              /\{\{video\}\}/gi, 
                              `<video src="${text.video}" controls style="max-width: 100%; height: auto; border-radius: 6px; margin: 12px 0;">Seu navegador não suporta vídeos.</video>`
                            );
                          } else {
                            content = content.replace(
                              /\{\{video\}\}/gi, 
                              '<div style="padding: 20px; background: #2f2d2d; border: 2px dashed #4a90d9; border-radius: 6px; text-align: center; color: #9e9e9e; margin: 12px 0;">🎬 Vídeo não anexado</div>'
                            );
                          }
                          
                          return content;
                        })()
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Campain;
