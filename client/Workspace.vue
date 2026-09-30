<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { api, act } from "./api";
const props = defineProps(["user"]);
const tickets = ref([]),
  selected = ref(null),
  messages = ref([]),
  subject = ref("Kurulum konusunda destek"),
  body = ref("");
let events;
async function load() {
  tickets.value = await api("/tickets");
  if (selected.value)
    await open(
      tickets.value.find((t) => t.id === selected.value.id) || selected.value,
    );
}
async function open(t) {
  selected.value = t;
  messages.value = await api("/tickets/" + t.id + "/messages");
}
onMounted(async () => {
  await act(load, "");
  events = new EventSource("/api/events");
  events.addEventListener("message", () => act(load, ""));
  events.onopen = () => act(load, "");
});
onUnmounted(() => events?.close());
</script>
<template>
  <div class="grid">
    <section class="panel">
      <h2>
        {{
          props.user.id === "demo"
            ? "Temsilci gelen kutusu"
            : "Destek taleplerim"
        }}
      </h2>
      <form
        class="toolbar"
        @submit.prevent="
          act(async () => {
            await api('/tickets', 'POST', { subject });
            await load();
          })
        "
      >
        <input aria-label="Talep konusu" v-model="subject" required /><button>
          Talep aç
        </button>
      </form>
      <div v-for="t in tickets" class="card">
        <button class="ghost" @click="act(() => open(t), '')">
          {{ t.subject }}</button
        ><small>{{ t.status }} · {{ t.created_at }}</small>
      </div>
      <p class="muted">
        demo hesabı temsilci, other hesabı müşteridir. İki farklı tarayıcı
        oturumuyla mesajlaşabilirsin.
      </p>
    </section>
    <section class="panel">
      <template v-if="selected"
        ><h2>{{ selected.subject }}</h2>
        <label v-if="props.user.id === 'demo'"
          >Durum<select
            :value="selected.status"
            @change="
              act(async () => {
                await api('/tickets/' + selected.id, 'PATCH', {
                  status: $event.target.value,
                });
                await load();
              })
            "
          >
            <option>open</option>
            <option>pending</option>
            <option>closed</option>
          </select></label
        >
        <div class="chat">
          <div class="bubble" v-for="m in messages">
            <strong>{{ m.name }}</strong>
            <p>{{ m.body }}</p>
            <small>{{ m.created_at }}</small>
          </div>
        </div>
        <form
          @submit.prevent="
            act(async () => {
              await api('/tickets/' + selected.id + '/messages', 'POST', {
                body,
              });
              body = '';
              await load();
            })
          "
        >
          <label
            >Mesaj<textarea
              v-model="body"
              maxlength="4000"
              required
            ></textarea></label
          ><button :disabled="selected.status === 'closed'">Gönder</button>
        </form></template
      >
      <p v-else class="empty">Mesajlaşmak için bir talep seç.</p>
    </section>
  </div>
</template>
