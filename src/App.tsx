import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout";
import { VideoSplitter } from "@/components/video-splitter";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="splitz-theme">
      <Layout>
        <VideoSplitter />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
