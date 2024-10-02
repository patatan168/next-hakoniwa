import IslandList from './component/IslandList';
import LoginForm from './component/LoginForm';
import Title from './component/Title';

export default function Home() {
  return (
    <>
      <Title />
      <LoginForm />
      <IslandList />
    </>
  );
}
