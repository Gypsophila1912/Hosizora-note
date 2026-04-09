type Callback = (payload: any) => void; //戻り値のない関数を実行する型

const listeners: Record<string, Callback[]> = {}; //キーと関数の対応

export const eventBus = {
  on(event: string, callback: Callback) {
    listeners[event] = listeners[event] || []; //イベントが存在しない場合はイベント作成
    listeners[event].push(callback); //イベントに関数を追加
  },

  emit(event: string, payload: any) {
    listeners[event]?.forEach((cb) => {
      cb(payload);
    });
  },
};
//cbは取り出した関数、ペイロードはもらった関数に渡す引数。
