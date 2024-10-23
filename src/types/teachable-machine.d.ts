declare namespace tmImage {
  interface Model {
    predict(image: HTMLImageElement): Promise<Array<{ className: string; probability: number; }>>;
  }

  interface TeachableMachine {
    load(modelUrl: string, metadataUrl: string): Promise<Model>;
  }
}

interface Window {
  tmImage: {
    load(modelUrl: string, metadataUrl: string): Promise<tmImage.Model>;
  };
}