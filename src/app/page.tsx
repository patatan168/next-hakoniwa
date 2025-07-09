import IslandList from './component/IslandList';
import SignIn from './component/SignIn';
import SignUp from './component/SignUp';
import Title from './component/Title';

export default function Home() {
  return (
    <>
      <Title />
      <SignUp />
      <SignIn />
      <IslandList />
    </>
  );
}
