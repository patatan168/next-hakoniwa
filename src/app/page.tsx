/**
 * @module page
 * @description トップページ。島一覧とタイトルを表示する。
 */
import IslandList from './component/IslandList';
import Title from './component/Title';

export default function Home() {
  return (
    <>
      <Title />
      <IslandList />
    </>
  );
}
