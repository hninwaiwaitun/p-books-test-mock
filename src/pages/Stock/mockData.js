// src/pages/Stock/mockData.js

/**
 * 在庫管理用の初期登録済みダミーデータ（計11件）
 */
export const dummyStocks = [
  { id: 'STK-001', title: 'Pythonで学ぶ自動化スクリプト実践', category: '技術書', price: 3200, stock: 15, location: 'A-1' },
  { id: 'STK-002', title: 'Webデザインの新標準 2026', category: 'デザイン', price: 2800, stock: 4, location: 'B-3' },
  { id: 'STK-003', title: 'オブジェクト指向リファクタリング入門', category: '技術書', price: 4250, stock: 22, location: 'A-2' },
  { id: 'STK-004', title: '明日から使えるマーケティング心理学', category: 'ビジネス', price: 1600, stock: 0, location: 'C-1' },
  { id: 'STK-005', title: 'Vue 3 徹底解説 - 応用コンポーネント編', category: '技術書', price: 3800, stock: 8, location: 'A-3' },
  { id: 'STK-006', title: 'Pythonによるデータ分析の教科書', category: '技術書', price: 3800, stock: 12, location: 'A-3' },
  { id: 'STK-007', title: '現代マクロ経済学の基礎', category: '専門書', price: 4200, stock: 4, location: 'B-1' },
  { id: 'STK-008', title: '3ヶ月で結果を出すWebマーケティング', category: 'ビジネス', price: 1600, stock: 25, location: 'C-2' },
  { id: 'STK-009', title: '世界一わかりやすいプロジェクトマネジメント', category: 'ビジネス', price: 1980, stock: 0, location: 'C-1' }, // 在庫切れテスト用
  { id: 'STK-010', title: 'Docker/Kubernetes 実践コンテナ構築', category: '技術書', price: 4000, stock: 3, location: 'A-2' },  // 品薄テスト用
  { id: 'STK-011', title: 'デザインシステム構築ガイド', category: 'デザイン', price: 3200, stock: 8, location: 'D-1' },
  { id: 'STK-012', title: '論理的思考力を鍛えるディベート術', category: 'ビジネス', price: 1500, stock: 14, location: 'C-3' },
  { id: 'STK-013', title: 'Javaフレームワーク Spring Boot3 入門', category: '技術書', price: 3500, stock: 19, location: 'A-1' },
  { id: 'STK-014', title: '国際金融の仕組みとリスク管理', category: '専門書', price: 5000, stock: 2, location: 'B-2' },  // 品薄テスト用
  { id: 'STK-015', title: 'UI/UXデザインのための心理学', category: 'デザイン', price: 2800, stock: 7, location: 'D-2' },
  { id: 'STK-016', title: 'リーダブルコード完全解説', category: '技術書', price: 2400, stock: 45, location: 'A-4' },
  { id: 'STK-017', title: '行動経済学で読み解くヒット商品', category: 'ビジネス', price: 1800, stock: 11, location: 'C-2' },
  { id: 'STK-018', title: '本格eコマースサイト構築実践（Next.js）', category: '技術書', price: 4200, stock: 0, location: 'A-3' }, // 在庫切れテスト用
  { id: 'STK-019', title: '統計学入門：データサイエンスの第一歩', category: '専門書', price: 3000, stock: 15, location: 'B-3' },
  { id: 'STK-020', title: 'ゼロから始める財務諸表の読み方', category: 'ビジネス', price: 1650, stock: 22, location: 'C-1' },
  { id: 'STK-021', title: 'Webアニメーション最高峰の教科書', category: 'デザイン', price: 3600, stock: 6, location: 'D-1' },
  { id: 'STK-022', title: 'TypeScript実践開発ロードマップ', category: '技術書', price: 3400, stock: 30, location: 'A-2' },
  { id: 'STK-023', title: 'コーポレート・ファイナンス戦略', category: '専門書', price: 5800, stock: 5, location: 'B-1' },  // 品薄テスト用
  { id: 'STK-024', title: '人を動かすコピーライティング技術', category: 'ビジネス', price: 1700, stock: 13, location: 'C-3' },
  { id: 'STK-025', title: 'クラウドネイティブ基盤設計（Azure編）', category: '技術書', price: 4800, stock: 9, location: 'A-1' }
];

/**
 * 初期のカテゴリ選択肢のリスト
 */
export const initialCategories = ['技術書', 'デザイン', 'ビジネス'];