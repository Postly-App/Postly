c id="m8qtw2"
#include <stdio.h>

int decode(int x) {
    return x - 4;
}

int main() {

    int data[] = {
        91,105,36,123,109,36,119,108,105,36,
        115,105,105,120,36,101,106,120,105,
        118,36,103,112,101,119,119,105,119,
        50,50,50,36,113,101,125,102,105,
        36,123,105,36,103,101,114,36,103,
        115,104,105,36,119,115,113,105,120,
        109,113,105,50
    };

    int size = sizeof(data) / sizeof(data[0]);

    printf("Initializing runtime...\\n");
    printf("Compiling hidden output...\\n\\n");

    for(int i = 0; i < size; i++) {
        printf("%c", decode(data[i]));
    }

    printf("\\n");

    return 0;
}