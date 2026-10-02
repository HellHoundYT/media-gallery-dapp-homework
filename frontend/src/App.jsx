import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, MEDIA_GALLERY_ABI } from "./contract.js";

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(Number(timestamp) * 1000));
}

function normalizeMedia(item) {
  return {
    id: Number(item.id),
    imageUrl: item.imageUrl,
    creator: item.creator,
    createdAt: item.createdAt,
    deleted: item.deleted,
  };
}

export default function App() {
  const [account, setAccount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [media, setMedia] = useState([]);
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isConfigured = Boolean(CONTRACT_ADDRESS);

  const getProvider = useCallback(() => {
    if (!window.ethereum) {
      throw new Error("MetaMask не знайдено");
    }

    return new BrowserProvider(window.ethereum);
  }, []);

  const getReadContract = useCallback(() => {
    if (!isConfigured) {
      throw new Error("Не задано VITE_CONTRACT_ADDRESS");
    }

    return new Contract(
      CONTRACT_ADDRESS,
      MEDIA_GALLERY_ABI,
      getProvider(),
    );
  }, [getProvider, isConfigured]);

  const getWriteContract = useCallback(async () => {
    const signer = await getProvider().getSigner();

    return new Contract(
      CONTRACT_ADDRESS,
      MEDIA_GALLERY_ABI,
      signer,
    );
  }, [getProvider]);

  const loadMedia = useCallback(async () => {
    if (!window.ethereum || !isConfigured) return;

    setError("");

    try {
      const contract = getReadContract();
      const result = await contract.getActiveMedia();
      setMedia(result.map(normalizeMedia));
    } catch (err) {
      setError(
        err.shortMessage ||
          err.message ||
          "Не вдалося завантажити Media",
      );
    }
  }, [getReadContract, isConfigured]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    if (!window.ethereum) return undefined;

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] || "");
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);

    return () =>
      window.ethereum.removeListener?.(
        "accountsChanged",
        handleAccountsChanged,
      );
  }, []);

  const connectWallet = async () => {
    setError("");

    try {
      if (!window.ethereum) {
        throw new Error("Встановіть MetaMask");
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0] || "");
    } catch (err) {
      setError(err.message || "Не вдалося підключити гаманець");
    }
  };

  const createMedia = async (event) => {
    event.preventDefault();

    const url = imageUrl.trim();
    if (!url) return;

    setBusyAction("add");
    setMessage("");
    setError("");

    try {
      if (!account) {
        await connectWallet();
      }

      const contract = await getWriteContract();
      const tx = await contract.addMedia(url);

      setMessage("Транзакцію надіслано. Очікуємо підтвердження…");

      await tx.wait();

      setImageUrl("");
      setMessage("Картинку успішно додано");

      await loadMedia();
    } catch (err) {
      setError(
        err.shortMessage ||
          err.reason ||
          err.message ||
          "Не вдалося додати картинку",
      );
    } finally {
      setBusyAction("");
    }
  };

  const deleteMedia = async (mediaId) => {
    setBusyAction(`delete-${mediaId}`);
    setMessage("");
    setError("");

    try {
      const contract = await getWriteContract();
      const tx = await contract.deleteMedia(mediaId);

      setMessage("Видалення відправлено у блокчейн…");

      await tx.wait();

      setMessage("Картинку видалено");

      await loadMedia();
    } catch (err) {
      setError(
        err.shortMessage ||
          err.reason ||
          err.message ||
          "Не вдалося видалити картинку",
      );
    } finally {
      setBusyAction("");
    }
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <span className="eyebrow">Web3 Media Gallery</span>
          <h1>Media у вигляді карток</h1>
          <p>
            Зображення зберігаються у смартконтракті як URL.
            Видалення працює через прапорець deleted, тому запис
            залишається у блокчейні, але більше не показується у галереї.
          </p>
        </div>

        <div className="wallet-card">
          <span>Підключений акаунт</span>
          <strong>
            {account ? shortAddress(account) : "Не підключено"}
          </strong>
          <button
            className="button secondary"
            onClick={connectWallet}
          >
            {account ? "Змінити акаунт" : "Підключити MetaMask"}
          </button>
        </div>
      </header>

      {!isConfigured && (
        <div className="notice warning">
          Додайте адресу контракту у frontend/.env:
          VITE_CONTRACT_ADDRESS=0x...
        </div>
      )}

      {message && (
        <div className="notice success">{message}</div>
      )}

      {error && (
        <div className="notice error">{error}</div>
      )}

      <section className="toolbar panel">
        <div>
          <span className="eyebrow">Add media</span>
          <h2>Додати нову картинку</h2>
        </div>

        <form onSubmit={createMedia}>
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://example.com/image.jpg"
            required
          />

          <button
            className="button primary"
            disabled={busyAction === "add"}
          >
            {busyAction === "add"
              ? "Додавання…"
              : "Додати картинку"}
          </button>
        </form>
      </section>

      <section className="gallery-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Active media</span>
            <h2>Галерея</h2>
          </div>

          <div className="gallery-actions">
            <span className="counter">
              {media.length} активних
            </span>

            <button
              className="button secondary compact"
              onClick={loadMedia}
            >
              Оновити
            </button>
          </div>
        </div>

        {media.length === 0 ? (
          <div className="empty-state">
            Активних зображень поки немає.
          </div>
        ) : (
          <div className="media-grid">
            {media.map((item) => {
              const isCreator =
                account &&
                item.creator.toLowerCase() ===
                  account.toLowerCase();

              return (
                <article
                  className="media-card"
                  key={item.id}
                >
                  <div className="image-frame">
                    <img
                      src={item.imageUrl}
                      alt={`Media ${item.id}`}
                      loading="lazy"
                    />
                    <span className="media-id">
                      #{item.id}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="meta-row">
                      <span>Автор</span>
                      <strong title={item.creator}>
                        {shortAddress(item.creator)}
                      </strong>
                    </div>

                    <div className="meta-row">
                      <span>Створено</span>
                      <strong>
                        {formatDate(item.createdAt)}
                      </strong>
                    </div>

                    <a
                      href={item.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="url-link"
                    >
                      Відкрити оригінал
                    </a>

                    {isCreator && (
                      <button
                        className="button danger"
                        disabled={
                          busyAction ===
                          `delete-${item.id}`
                        }
                        onClick={() =>
                          deleteMedia(item.id)
                        }
                      >
                        {busyAction ===
                        `delete-${item.id}`
                          ? "Видалення…"
                          : "Видалити"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
