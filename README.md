# Media Gallery DApp Homework

Домашня робота: Solidity контракт + React frontend для Media.

## Умова

1. Відобразити об'єкти Media у вигляді карток.
2. Додати можливість видаляти зображення. Використовувати флаг.
3. Оновлювати відображення після додавання картинки або її видалення.

## Реалізація

### Media

Контракт використовує структуру:

```solidity
struct Media {
    uint256 id;
    string imageUrl;
    address creator;
    uint256 createdAt;
    bool deleted;
}
```

### Soft delete через флаг

При видаленні запис не прибирається зі storage.

Контракт виконує:

```solidity
item.deleted = true;
```

Після цього `getActiveMedia()` повертає тільки Media, у яких:

```solidity
deleted == false
```

Додатково видаляти Media може тільки акаунт, який створив цей запис.

### Оновлення frontend

Після успішного:

```text
addMedia(...)
```

або:

```text
deleteMedia(...)
```

frontend очікує `tx.wait()` і повторно викликає:

```text
getActiveMedia()
```

Тому картки оновлюються одразу після підтвердження транзакції.

## Стек

- Solidity 0.8.28
- Hardhat 3
- Mocha + Chai + ethers
- React 19
- Vite 8
- MetaMask

## Структура

```text
contracts/MediaGallery.sol
test/MediaGallery.test.ts
ignition/modules/MediaGallery.ts
hardhat.config.ts

frontend/
  src/App.jsx
  src/contract.js
  src/styles.css
```

## Запуск контракту

Потрібен Node.js 22+.

```bash
npm install
npx hardhat build
npx hardhat test
```

Запуск локальної мережі:

```bash
npx hardhat node
```

В іншому терміналі:

```bash
npx hardhat ignition deploy ./ignition/modules/MediaGallery.ts --network localhost
```

Скопіюйте адресу `MediaGalleryModule#MediaGallery`.

## Frontend

```bash
cd frontend
npm install
```

Скопіюйте `.env.example` у `.env`:

```env
VITE_CONTRACT_ADDRESS=0x...
```

Потім:

```bash
npm run dev
```

## MetaMask

Локальна Hardhat мережа:

```text
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency: ETH
```

Імпортуйте один із тестових акаунтів, які Hardhat показує після запуску `npx hardhat node`.
