import IslandList from './component/IslandList';
import SignUp from './component/SignUp';
import Title from './component/Title';

export default function Home() {
  return (
    <>
      <Title />
      <SignUp />
      <IslandList />
    </>
  );
}
